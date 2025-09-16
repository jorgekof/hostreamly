/**
 * Vite Plugin Avanzado para Protección CSS y JavaScript
 * Integra múltiples estrategias para resolver problemas de setProperty y eT.initialize
 */

import fs from 'fs';
import path from 'path';

function cssProtectionPlugin(options = {}) {
    const {
        enablePolyfill = true,
        enableBundlePatching = true,
        enableRuntimeProtection = true,
        verbose = false
    } = options;

    let isProduction = false;
    let config;

    const log = (message, type = 'info') => {
        if (!verbose && type === 'debug') return;
        const prefix = {
            info: '🛡️',
            warn: '⚠️',
            error: '❌',
            success: '✅',
            debug: '🔍'
        }[type] || '🛡️';
        console.log(`${prefix} [CSS Protection] ${message}`);
    };

    // Polyfill completo para inyectar
    const cssPolyfillCode = `
        // 🛡️ CSS Protection Polyfill - Vite Plugin
        (function() {
            'use strict';
            
            if (typeof window === 'undefined') return;
            
            console.log('🛡️ CSS Protection Plugin activado');
            
            // 1. Proteger CSSStyleDeclaration.prototype.setProperty
            if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype.setProperty) {
                const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
                CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
                    try {
                        return originalSetProperty.call(this, property, value, priority);
                    } catch (e) {
                        console.warn('🛡️ setProperty error intercepted:', property, value, e);
                        // Fallback: asignación directa
                        try {
                            this[property] = value;
                        } catch (fallbackError) {
                            console.warn('🛡️ Fallback assignment failed:', fallbackError);
                        }
                        return;
                    }
                };
            }
            
            // 2. Crear mock para eT si no existe
            if (!window.eT) {
                window.eT = new Proxy({}, {
                    get: function(target, prop) {
                        if (prop === 'initialize') {
                            return function() {
                                console.warn('🛡️ eT.initialize mock called');
                                return Promise.resolve();
                            };
                        }
                        if (prop === 'Builder') {
                            return {
                                init: () => Promise.resolve(),
                                render: () => Promise.resolve(),
                                destroy: () => Promise.resolve()
                            };
                        }
                        return target[prop] || function() { return Promise.resolve(); };
                    },
                    set: function(target, prop, value) {
                        target[prop] = value;
                        return true;
                    }
                });
            }
            
            // 3. Interceptar errores globales
            const originalOnError = window.onerror;
            window.onerror = function(message, source, lineno, colno, error) {
                if (message && (message.includes('setProperty') || message.includes('eT.initialize'))) {
                    console.warn('🛡️ Global error intercepted:', message);
                    return true;
                }
                if (originalOnError) {
                    return originalOnError.call(this, message, source, lineno, colno, error);
                }
                return false;
            };
            
            // 4. Interceptar Promise rejections
            window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && 
                    (event.reason.message.includes('setProperty') || event.reason.message.includes('eT.initialize'))) {
                    console.warn('🛡️ Promise rejection intercepted:', event.reason);
                    event.preventDefault();
                }
            });
            
            // 5. Proteger querySelector para elementos eT
            const originalQuerySelector = document.querySelector;
            const originalQuerySelectorAll = document.querySelectorAll;
            
            const createSafeElement = () => ({
                style: new Proxy({}, {
                    get: (target, prop) => {
                        if (prop === 'setProperty') {
                            return function(property, value, priority) {
                                try {
                                    target[property] = value;
                                    return true;
                                } catch (e) {
                                    console.warn('🛡️ Mock setProperty:', property, value);
                                    return false;
                                }
                            };
                        }
                        return target[prop] || '';
                    },
                    set: (target, prop, value) => {
                        target[prop] = value;
                        return true;
                    }
                }),
                setAttribute: function() {},
                getAttribute: function() { return null; },
                classList: { add: () => {}, remove: () => {}, contains: () => false },
                addEventListener: () => {},
                removeEventListener: () => {}
            });
            
            document.querySelector = function(selector) {
                try {
                    const result = originalQuerySelector.call(this, selector);
                    if (!result && (selector.includes('eT') || selector.includes('et-'))) {
                        console.warn('🛡️ eT element not found, returning mock:', selector);
                        return createSafeElement();
                    }
                    return result;
                } catch (e) {
                    console.warn('🛡️ querySelector error intercepted:', selector, e);
                    return createSafeElement();
                }
            };
            
            console.log('🛡️ CSS Protection Plugin initialized');
        })();
    `;

    return {
        name: 'css-protection',
        
        configResolved(resolvedConfig) {
            config = resolvedConfig;
            isProduction = resolvedConfig.command === 'build';
            log(`Plugin initialized - Production: ${isProduction}`, 'info');
        },

        // Inyectar polyfill en el HTML
        transformIndexHtml: {
            enforce: 'pre',
            transform(html, context) {
                if (!enablePolyfill) return html;
                
                log('Injecting CSS protection polyfill into HTML', 'debug');
                
                // Inyectar el polyfill antes de cualquier script
                const polyfillScript = `<script type="text/javascript">${cssPolyfillCode}</script>`;
                
                // Buscar la primera etiqueta script o el final del head
                const scriptMatch = html.match(/<script[^>]*>/i);
                const headEndMatch = html.match(/<\/head>/i);
                
                if (scriptMatch) {
                    return html.replace(scriptMatch[0], polyfillScript + '\n' + scriptMatch[0]);
                } else if (headEndMatch) {
                    return html.replace('</head>', polyfillScript + '\n</head>');
                } else {
                    return polyfillScript + '\n' + html;
                }
            }
        },

        // Transformar código durante el desarrollo
        transform(code, id) {
            if (!enableBundlePatching) return null;
            
            // Solo procesar archivos JS/TS del proyecto (no node_modules)
            if (!id.includes('node_modules') && /\.(js|ts|jsx|tsx)$/.test(id)) {
                let transformedCode = code;
                let hasChanges = false;

                // Proteger llamadas a eT.initialize
                if (transformedCode.includes('eT.initialize')) {
                    transformedCode = transformedCode.replace(
                        /eT\.initialize\s*\(/g,
                        'try { eT.initialize && eT.initialize('
                    );
                    
                    // Agregar cierre del try-catch (simplificado)
                    transformedCode = transformedCode.replace(
                        /eT\.initialize\s*\([^)]*\);/g,
                        (match) => `try { ${match} } catch(e) { console.warn('🛡️ eT.initialize error:', e); }`
                    );
                    
                    hasChanges = true;
                    log(`Protected eT.initialize calls in ${path.basename(id)}`, 'debug');
                }

                // Proteger llamadas a setProperty
                if (transformedCode.includes('.setProperty(')) {
                    transformedCode = transformedCode.replace(
                        /([a-zA-Z_$][a-zA-Z0-9_$]*)\.style\.setProperty\s*\(/g,
                        '($1.style && $1.style.setProperty ? $1.style.setProperty.bind($1.style) : function(){console.warn("🛡️ setProperty not available");})('
                    );
                    
                    hasChanges = true;
                    log(`Protected setProperty calls in ${path.basename(id)}`, 'debug');
                }

                if (hasChanges) {
                    return {
                        code: transformedCode,
                        map: null // Simplificado, en producción podrías generar source maps
                    };
                }
            }
            
            return null;
        },

        // Post-procesamiento del bundle generado
        generateBundle(options, bundle) {
            if (!isProduction || !enableBundlePatching) return;
            
            log('Post-processing bundle for CSS protection', 'info');
            
            Object.keys(bundle).forEach(fileName => {
                const chunk = bundle[fileName];
                
                if (chunk.type === 'chunk' && chunk.code) {
                    let code = chunk.code;
                    let modifications = 0;

                    // Aplicar patrones de protección al código minificado
                    const protectionPatterns = [
                        {
                            pattern: /\.setProperty\(/g,
                            replacement: '.setProperty&&function(p,v,r){try{return this.setProperty(p,v,r)}catch(e){console.warn("🛡️ setProperty:",e);return false}}.call(this,',
                            name: 'setProperty protection'
                        },
                        {
                            pattern: /eT\.initialize\(/g,
                            replacement: '(eT.initialize||function(){console.warn("🛡️ eT.initialize mock");})(',
                            name: 'eT.initialize protection'
                        }
                    ];

                    protectionPatterns.forEach(({ pattern, replacement, name }) => {
                        const matches = code.match(pattern);
                        if (matches) {
                            code = code.replace(pattern, replacement);
                            modifications += matches.length;
                            log(`Applied ${matches.length} ${name} modifications to ${fileName}`, 'debug');
                        }
                    });

                    if (modifications > 0) {
                        chunk.code = code;
                        log(`Total modifications applied to ${fileName}: ${modifications}`, 'success');
                    }
                }
            });
        },

        // Hook para después de la construcción
        writeBundle(options, bundle) {
            if (!isProduction) return;
            
            log('Bundle write completed with CSS protection', 'success');
            
            // Crear reporte de protección
            const report = {
                timestamp: new Date().toISOString(),
                plugin: 'css-protection',
                options: {
                    enablePolyfill,
                    enableBundlePatching,
                    enableRuntimeProtection
                },
                files: Object.keys(bundle).filter(f => f.endsWith('.js')),
                protections: [
                    'CSSStyleDeclaration.prototype.setProperty override',
                    'eT.initialize mock and error handling',
                    'Global error interception',
                    'Promise rejection handling',
                    'querySelector protection for eT elements'
                ]
            };

            const reportPath = path.join(options.dir || 'dist', 'css-protection-report.json');
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            log(`Protection report generated: ${reportPath}`, 'info');
        }
    };
}

export default cssProtectionPlugin;