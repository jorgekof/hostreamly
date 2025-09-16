#!/usr/bin/env node

/**
 * 🚀 Script de Despliegue Simplificado para DigitalOcean
 * Crea una app básica y la configura paso a paso
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SimpleDeployer {
    constructor() {
        this.appName = 'hostreamly-simple';
        this.projectRoot = process.cwd();
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }

    execCommand(command, description) {
        this.log(`Ejecutando: ${description}`);
        try {
            const result = execSync(command, { 
                encoding: 'utf8', 
                stdio: 'pipe',
                cwd: this.projectRoot 
            });
            this.log(`✅ ${description} - Completado`);
            return result;
        } catch (error) {
            this.log(`❌ Error en: ${description}`, 'ERROR');
            this.log(`Error: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    createSimpleApp() {
        this.log('🚀 Creando app simple en DigitalOcean...');
        
        // Crear configuración mínima
        const minimalConfig = {
            name: this.appName,
            static_sites: [{
                name: 'hostreamly-frontend',
                source_dir: '/',
                build_command: 'npm install && npm run build',
                environment_slug: 'node-js',
                routes: [{ path: '/' }],
                catchall_document: 'index.html',
                envs: [
                    { key: 'NODE_ENV', value: 'production' },
                    { key: 'VITE_NODE_ENV', value: 'production' }
                ]
            }]
        };
        
        // Escribir configuración temporal
        const configPath = path.join(this.projectRoot, 'temp-app-config.yaml');
        const yamlContent = this.objectToYaml(minimalConfig);
        fs.writeFileSync(configPath, yamlContent);
        
        try {
            // Intentar crear la app
            this.execCommand(`.\\.\\doctl apps create --spec ${configPath}`, 'Crear app simple');
        } finally {
            // Limpiar archivo temporal
            if (fs.existsSync(configPath)) {
                fs.unlinkSync(configPath);
            }
        }
    }

    objectToYaml(obj, indent = 0) {
        let yaml = '';
        const spaces = ' '.repeat(indent);
        
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                for (const item of value) {
                    if (typeof item === 'object') {
                        yaml += `${spaces}- `;
                        const itemYaml = this.objectToYaml(item, indent + 2);
                        yaml += itemYaml.substring(indent + 2);
                    } else {
                        yaml += `${spaces}- ${item}\n`;
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                yaml += `${spaces}${key}:\n`;
                yaml += this.objectToYaml(value, indent + 2);
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }
        
        return yaml;
    }

    checkAppStatus() {
        this.log('📊 Verificando estado de la app...');
        
        try {
            const result = this.execCommand(`.\\.\\doctl apps list --format Name,Status,LiveURL --no-header`, 'Listar apps');
            
            const lines = result.trim().split('\n');
            for (const line of lines) {
                if (line.includes(this.appName)) {
                    this.log(`📱 App encontrada: ${line}`);
                    return line;
                }
            }
            
            this.log('⚠️ App no encontrada', 'WARN');
            return null;
            
        } catch (error) {
            this.log(`Error verificando apps: ${error.message}`, 'ERROR');
            return null;
        }
    }

    waitForDeployment() {
        this.log('⏳ Esperando que el despliegue se complete...');
        
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            const status = this.checkAppStatus();
            
            if (status && status.includes('ACTIVE')) {
                this.log('✅ Despliegue completado exitosamente');
                return true;
            } else if (status && status.includes('ERROR')) {
                throw new Error('El despliegue falló');
            }
            
            attempts++;
            this.log(`⏳ Intento ${attempts}/${maxAttempts} - Esperando 30 segundos...`);
            
            // Esperar 30 segundos
            try {
                execSync('timeout 30 2>nul', { stdio: 'ignore' });
            } catch {
                // Timeout completado
            }
        }
        
        throw new Error('Timeout esperando el despliegue');
    }

    async deploy() {
        try {
            this.log('🚀 Iniciando despliegue simplificado...');
            
            // Verificar si ya existe una app
            const existingApp = this.checkAppStatus();
            
            if (!existingApp) {
                // Crear nueva app
                this.createSimpleApp();
                
                // Esperar que se complete
                this.waitForDeployment();
            } else {
                this.log('📱 App ya existe, verificando estado...');
            }
            
            // Mostrar información final
            const finalStatus = this.checkAppStatus();
            if (finalStatus) {
                const parts = finalStatus.split(/\s+/);
                if (parts.length >= 3) {
                    const url = parts[2];
                    if (url && url.startsWith('http')) {
                        console.log('\n' + '='.repeat(60));
                        console.log('🌐 TU APLICACIÓN ESTÁ LISTA:');
                        console.log(`📱 URL: ${url}`);
                        console.log('='.repeat(60));
                    }
                }
            }
            
            this.log('🎉 ¡Proceso completado!');
            
        } catch (error) {
            this.log(`💥 Error en el despliegue: ${error.message}`, 'ERROR');
            console.error('\n❌ Despliegue falló.');
            process.exit(1);
        }
    }
}

// Ejecutar el despliegue
if (require.main === module) {
    const deployer = new SimpleDeployer();
    deployer.deploy();
}

module.exports = SimpleDeployer;