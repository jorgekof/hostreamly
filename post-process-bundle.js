#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script de post-procesamiento para corregir problemas en el bundle compilado
 * Detecta y corrige patrones problemáticos relacionados con eT.initialize y setProperty
 */

class BundlePostProcessor {
    constructor(distPath = './dist') {
        this.distPath = distPath;
        this.processedFiles = 0;
        this.corrections = 0;
        this.patterns = [
            // Patrones problemáticos a detectar y corregir
            {
                name: 'eT.initialize calls',
                pattern: /eT\.initialize\s*\(/g,
                replacement: 'try { eT.initialize && eT.initialize(',
                suffix: ' } catch(e) { console.warn("🛡️ eT.initialize error intercepted:", e); }'
            },
            {
                name: 'setProperty calls without safety',
                pattern: /\.setProperty\s*\(/g,
                replacement: '.setProperty && (function(prop, val, pri) { try { return this.setProperty(prop, val, pri); } catch(e) { console.warn("🛡️ setProperty error:", e); return false; } }).call(this, '
            },
            {
                name: 'Direct style.setProperty',
                pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*)\.style\.setProperty\s*\(/g,
                replacement: '($1.style && $1.style.setProperty ? $1.style.setProperty : function(){console.warn("🛡️ setProperty not available");})('
            },
            {
                name: 'eT object access',
                pattern: /window\.eT\s*=/g,
                replacement: 'window.eT = window.eT || '
            },
            {
                name: 'Undefined property access on style',
                pattern: /\.style\[([^\]]+)\]\s*=/g,
                replacement: '.style && (.style[$1] = '
            }
        ];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📋',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async findJSFiles() {
        return new Promise((resolve, reject) => {
            const pattern = path.join(this.distPath, '**/*.js');
            glob(pattern, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });
    }

    processFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            let fileCorrections = 0;

            // Aplicar cada patrón de corrección
            this.patterns.forEach(pattern => {
                const matches = content.match(pattern.pattern);
                if (matches) {
                    this.log(`Encontrados ${matches.length} casos de '${pattern.name}' en ${path.basename(filePath)}`, 'warning');
                    
                    if (pattern.name === 'setProperty calls without safety') {
                        // Manejo especial para setProperty
                        content = content.replace(pattern.pattern, (match, offset) => {
                            const beforeMatch = content.substring(Math.max(0, offset - 50), offset);
                            const afterMatch = content.substring(offset + match.length, Math.min(content.length, offset + match.length + 100));
                            
                            // Verificar si ya está envuelto en try-catch
                            if (beforeMatch.includes('try') && afterMatch.includes('catch')) {
                                return match; // Ya está protegido
                            }
                            
                            fileCorrections++;
                            return pattern.replacement;
                        });
                    } else {
                        // Aplicar reemplazo normal
                        const newContent = content.replace(pattern.pattern, pattern.replacement + (pattern.suffix || ''));
                        if (newContent !== content) {
                            content = newContent;
                            fileCorrections += matches.length;
                        }
                    }
                    
                    modified = true;
                }
            });

            // Inyectar polyfill de seguridad al inicio del archivo principal
            if (path.basename(filePath).includes('main') || path.basename(filePath).includes('index')) {
                const polyfillCode = `
                // 🛡️ Polyfill de seguridad inyectado por post-procesamiento
                (function() {
                    if (typeof window !== 'undefined') {
                        // Proteger setProperty globalmente
                        const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
                        if (originalSetProperty) {
                            CSSStyleDeclaration.prototype.setProperty = function(prop, val, pri) {
                                try {
                                    return originalSetProperty.call(this, prop, val, pri);
                                } catch(e) {
                                    console.warn('🛡️ setProperty protegido:', e);
                                    return false;
                                }
                            };
                        }
                        
                        // Crear eT mock si no existe
                        if (!window.eT) {
                            window.eT = {
                                initialize: function() {
                                    console.warn('🛡️ eT.initialize mock ejecutado');
                                    return Promise.resolve();
                                }
                            };
                        }
                    }
                })();
                `;
                
                if (!content.includes('🛡️ Polyfill de seguridad inyectado')) {
                    content = polyfillCode + content;
                    modified = true;
                    fileCorrections++;
                }
            }

            // Guardar archivo si fue modificado
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                this.corrections += fileCorrections;
                this.log(`Procesado ${path.basename(filePath)} - ${fileCorrections} correcciones aplicadas`, 'success');
            }

            this.processedFiles++;
            return { processed: true, corrections: fileCorrections };

        } catch (error) {
            this.log(`Error procesando ${filePath}: ${error.message}`, 'error');
            return { processed: false, corrections: 0, error };
        }
    }

    async createBackup() {
        const backupPath = `${this.distPath}_backup_${Date.now()}`;
        try {
            await this.copyDirectory(this.distPath, backupPath);
            this.log(`Backup creado en: ${backupPath}`, 'success');
            return backupPath;
        } catch (error) {
            this.log(`Error creando backup: ${error.message}`, 'error');
            throw error;
        }
    }

    async copyDirectory(src, dest) {
        const fs = require('fs-extra');
        await fs.copy(src, dest);
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            processedFiles: this.processedFiles,
            totalCorrections: this.corrections,
            patterns: this.patterns.map(p => p.name)
        };

        const reportPath = path.join(this.distPath, 'post-process-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`Reporte generado: ${reportPath}`, 'success');
        return report;
    }

    async run() {
        try {
            this.log('🚀 Iniciando post-procesamiento del bundle...', 'info');
            
            // Verificar que existe el directorio dist
            if (!fs.existsSync(this.distPath)) {
                throw new Error(`Directorio ${this.distPath} no encontrado`);
            }

            // Crear backup
            await this.createBackup();

            // Encontrar archivos JS
            const jsFiles = await this.findJSFiles();
            this.log(`Encontrados ${jsFiles.length} archivos JavaScript`, 'info');

            // Procesar cada archivo
            for (const file of jsFiles) {
                this.processFile(file);
            }

            // Generar reporte
            const report = this.generateReport();

            this.log(`✨ Post-procesamiento completado:`, 'success');
            this.log(`   - Archivos procesados: ${report.processedFiles}`, 'success');
            this.log(`   - Correcciones aplicadas: ${report.totalCorrections}`, 'success');

            return report;

        } catch (error) {
            this.log(`Error durante el post-procesamiento: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const distPath = process.argv[2] || './dist';
    const processor = new BundlePostProcessor(distPath);
    
    processor.run()
        .then(report => {
            console.log('\n🎉 Post-procesamiento exitoso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Error en post-procesamiento:', error.message);
            process.exit(1);
        });
}

module.exports = BundlePostProcessor;