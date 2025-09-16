/**
 * 🔍 Sistema de Detección y Reemplazo Dinámico de Código Problemático
 * Monitorea y corrige automáticamente problemas de CSS/JavaScript en tiempo real
 */

class DynamicCodeMonitor {
    constructor(options = {}) {
        this.options = {
            enableRealTimeMonitoring: true,
            enableAutoFix: true,
            enableLogging: true,
            monitorInterval: 1000, // ms
            maxRetries: 3,
            ...options
        };
        
        this.problemPatterns = new Map();
        this.fixStrategies = new Map();
        this.monitoringActive = false;
        this.detectedIssues = [];
        this.appliedFixes = [];
        
        this.initializePatterns();
        this.initializeFixStrategies();
        
        if (this.options.enableRealTimeMonitoring) {
            this.startMonitoring();
        }
    }
    
    /**
     * 🎯 Inicializar patrones de problemas conocidos
     */
    initializePatterns() {
        // Patrones de problemas CSS/JavaScript
        this.problemPatterns.set('setProperty_undefined', {
            pattern: /Cannot read propert(y|ies) of undefined \(reading 'setProperty'\)/i,
            severity: 'high',
            category: 'css',
            description: 'setProperty called on undefined element'
        });
        
        this.problemPatterns.set('eT_initialize_undefined', {
            pattern: /Cannot read propert(y|ies) of undefined \(reading 'initialize'\)/i,
            severity: 'high',
            category: 'javascript',
            description: 'eT.initialize called on undefined object'
        });
        
        this.problemPatterns.set('style_undefined', {
            pattern: /Cannot read propert(y|ies) of undefined \(reading 'style'\)/i,
            severity: 'medium',
            category: 'css',
            description: 'Style property accessed on undefined element'
        });
        
        this.problemPatterns.set('querySelector_null', {
            pattern: /Cannot read propert(y|ies) of null \(reading 'querySelector'\)/i,
            severity: 'medium',
            category: 'dom',
            description: 'querySelector called on null element'
        });
        
        this.problemPatterns.set('addEventListener_undefined', {
            pattern: /Cannot read propert(y|ies) of undefined \(reading 'addEventListener'\)/i,
            severity: 'medium',
            category: 'events',
            description: 'addEventListener called on undefined element'
        });
    }
    
    /**
     * 🔧 Inicializar estrategias de corrección
     */
    initializeFixStrategies() {
        // Estrategias de corrección automática
        this.fixStrategies.set('setProperty_undefined', {
            immediate: () => this.createSafeSetPropertyWrapper(),
            preventive: () => this.patchCSSStyleDeclaration(),
            fallback: () => this.createMockStyleElement()
        });
        
        this.fixStrategies.set('eT_initialize_undefined', {
            immediate: () => this.createETMock(),
            preventive: () => this.patchGlobalET(),
            fallback: () => this.createETFallback()
        });
        
        this.fixStrategies.set('style_undefined', {
            immediate: () => this.createSafeStyleWrapper(),
            preventive: () => this.patchElementPrototype(),
            fallback: () => this.createStyleProxy()
        });
        
        this.fixStrategies.set('querySelector_null', {
            immediate: () => this.createSafeQuerySelector(),
            preventive: () => this.patchDocumentMethods(),
            fallback: () => this.createQuerySelectorFallback()
        });
        
        this.fixStrategies.set('addEventListener_undefined', {
            immediate: () => this.createSafeEventListener(),
            preventive: () => this.patchEventMethods(),
            fallback: () => this.createEventListenerFallback()
        });
    }
    
    /**
     * 🚀 Iniciar monitoreo en tiempo real
     */
    startMonitoring() {
        if (this.monitoringActive) return;
        
        this.log('🔍 Iniciando monitoreo dinámico de código', 'info');
        this.monitoringActive = true;
        
        // Interceptar errores globales
        this.setupGlobalErrorHandling();
        
        // Interceptar console.error
        this.setupConsoleInterception();
        
        // Interceptar Promise rejections
        this.setupPromiseRejectionHandling();
        
        // Monitoreo periódico
        this.monitoringInterval = setInterval(() => {
            this.performPeriodicCheck();
        }, this.options.monitorInterval);
        
        // Monitoreo de mutaciones DOM
        this.setupDOMObserver();
        
        this.log('✅ Monitoreo dinámico activado', 'success');
    }
    
    /**
     * 🛑 Detener monitoreo
     */
    stopMonitoring() {
        if (!this.monitoringActive) return;
        
        this.monitoringActive = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.domObserver) {
            this.domObserver.disconnect();
        }
        
        this.log('🛑 Monitoreo dinámico detenido', 'info');
    }
    
    /**
     * 🌐 Configurar manejo de errores globales
     */
    setupGlobalErrorHandling() {
        const originalOnError = window.onerror;
        
        window.onerror = (message, source, lineno, colno, error) => {
            this.analyzeAndFixError({
                type: 'javascript',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                error: error,
                timestamp: Date.now()
            });
            
            // Llamar al handler original si existe
            if (originalOnError) {
                return originalOnError.call(window, message, source, lineno, colno, error);
            }
            
            return false;
        };
    }
    
    /**
     * 📝 Configurar interceptación de console
     */
    setupConsoleInterception() {
        const originalConsoleError = console.error;
        
        console.error = (...args) => {
            const message = args.join(' ');
            this.analyzeAndFixError({
                type: 'console',
                message: message,
                args: args,
                timestamp: Date.now()
            });
            
            // Llamar al console.error original
            originalConsoleError.apply(console, args);
        };
    }
    
    /**
     * 🔄 Configurar manejo de Promise rejections
     */
    setupPromiseRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            this.analyzeAndFixError({
                type: 'promise',
                message: event.reason?.message || event.reason,
                reason: event.reason,
                timestamp: Date.now()
            });
        });
    }
    
    /**
     * 👁️ Configurar observador de mutaciones DOM
     */
    setupDOMObserver() {
        if (!window.MutationObserver) return;
        
        this.domObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkElementForIssues(node);
                        }
                    });
                }
            });
        });
        
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * 🔍 Analizar y corregir errores
     */
    analyzeAndFixError(errorInfo) {
        const detectedProblems = [];
        
        // Analizar el mensaje de error contra patrones conocidos
        for (const [patternId, pattern] of this.problemPatterns) {
            if (pattern.pattern.test(errorInfo.message)) {
                detectedProblems.push({
                    patternId,
                    pattern,
                    errorInfo,
                    detectedAt: Date.now()
                });
            }
        }
        
        // Aplicar correcciones para problemas detectados
        detectedProblems.forEach(problem => {
            this.applyFix(problem);
        });
        
        if (detectedProblems.length > 0) {
            this.detectedIssues.push(...detectedProblems);
            this.log(`🔍 Detectados ${detectedProblems.length} problemas, aplicando correcciones`, 'warn');
        }
    }
    
    /**
     * 🔧 Aplicar corrección para un problema específico
     */
    applyFix(problem) {
        const strategy = this.fixStrategies.get(problem.patternId);
        if (!strategy) return;
        
        let fixApplied = false;
        let retries = 0;
        
        // Intentar corrección inmediata
        while (!fixApplied && retries < this.options.maxRetries) {
            try {
                if (strategy.immediate) {
                    strategy.immediate();
                    fixApplied = true;
                    this.log(`✅ Corrección inmediata aplicada para: ${problem.patternId}`, 'success');
                }
            } catch (error) {
                this.log(`❌ Error en corrección inmediata: ${error.message}`, 'error');
                retries++;
            }
        }
        
        // Aplicar corrección preventiva
        if (strategy.preventive) {
            try {
                strategy.preventive();
                this.log(`🛡️ Corrección preventiva aplicada para: ${problem.patternId}`, 'info');
            } catch (error) {
                this.log(`❌ Error en corrección preventiva: ${error.message}`, 'error');
            }
        }
        
        // Aplicar fallback si es necesario
        if (!fixApplied && strategy.fallback) {
            try {
                strategy.fallback();
                fixApplied = true;
                this.log(`🔄 Fallback aplicado para: ${problem.patternId}`, 'warn');
            } catch (error) {
                this.log(`❌ Error en fallback: ${error.message}`, 'error');
            }
        }
        
        if (fixApplied) {
            this.appliedFixes.push({
                problem,
                appliedAt: Date.now(),
                strategy: 'immediate'
            });
        }
    }
    
    /**
     * 🔧 Crear wrapper seguro para setProperty
     */
    createSafeSetPropertyWrapper() {
        if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype.setProperty) {
            const original = CSSStyleDeclaration.prototype.setProperty;
            CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
                try {
                    return original.call(this, property, value, priority);
                } catch (e) {
                    console.warn('🛡️ setProperty protegido:', property, value, e);
                    // Fallback: asignación directa
                    try {
                        this[property] = value;
                    } catch (fallbackError) {
                        console.warn('🛡️ Fallback setProperty falló:', fallbackError);
                    }
                }
            };
        }
    }
    
    /**
     * 🎭 Crear mock para eT
     */
    createETMock() {
        if (!window.eT) {
            window.eT = new Proxy({}, {
                get: (target, prop) => {
                    if (prop === 'initialize') {
                        return function(...args) {
                            console.warn('🛡️ eT.initialize mock ejecutado');
                            return Promise.resolve();
                        };
                    }
                    return target[prop] || function() { return Promise.resolve(); };
                },
                set: (target, prop, value) => {
                    target[prop] = value;
                    return true;
                }
            });
        }
    }
    
    /**
     * 🎨 Crear elemento de estilo mock
     */
    createMockStyleElement() {
        return {
            setProperty: function(property, value, priority) {
                console.warn('🛡️ Mock setProperty:', property, value);
                this[property] = value;
            },
            getPropertyValue: function(property) {
                return this[property] || '';
            },
            removeProperty: function(property) {
                delete this[property];
            }
        };
    }
    
    /**
     * 🔍 Verificación periódica
     */
    performPeriodicCheck() {
        // Verificar elementos críticos
        const criticalSelectors = [
            '[data-et-initialize]',
            '.et-builder',
            '[class*="et-"]',
            '[id*="et-"]'
        ];
        
        criticalSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    this.checkElementForIssues(element);
                });
            } catch (error) {
                this.log(`❌ Error en verificación periódica: ${error.message}`, 'error');
            }
        });
    }
    
    /**
     * 🔍 Verificar elemento por problemas
     */
    checkElementForIssues(element) {
        if (!element || !element.style) return;
        
        // Verificar si el elemento tiene style
        if (!element.style.setProperty) {
            element.style = new Proxy(element.style || {}, {
                get: (target, prop) => {
                    if (prop === 'setProperty') {
                        return this.createMockStyleElement().setProperty;
                    }
                    return target[prop];
                },
                set: (target, prop, value) => {
                    target[prop] = value;
                    return true;
                }
            });
        }
    }
    
    /**
     * 📊 Obtener estadísticas de monitoreo
     */
    getStats() {
        return {
            monitoringActive: this.monitoringActive,
            detectedIssues: this.detectedIssues.length,
            appliedFixes: this.appliedFixes.length,
            patterns: this.problemPatterns.size,
            strategies: this.fixStrategies.size,
            uptime: this.monitoringActive ? Date.now() - this.startTime : 0
        };
    }
    
    /**
     * 📝 Sistema de logging
     */
    log(message, type = 'info') {
        if (!this.options.enableLogging) return;
        
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '🔍',
            warn: '⚠️',
            error: '❌',
            success: '✅'
        }[type] || '🔍';
        
        console.log(`${prefix} [Dynamic Monitor] ${timestamp}: ${message}`);
    }
    
    /**
     * 🧹 Limpiar recursos
     */
    cleanup() {
        this.stopMonitoring();
        this.detectedIssues = [];
        this.appliedFixes = [];
        this.log('🧹 Recursos limpiados', 'info');
    }
}

// 🚀 Auto-inicialización si estamos en el navegador
if (typeof window !== 'undefined') {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dynamicCodeMonitor = new DynamicCodeMonitor({
                enableRealTimeMonitoring: true,
                enableAutoFix: true,
                enableLogging: true,
                monitorInterval: 2000
            });
        });
    } else {
        window.dynamicCodeMonitor = new DynamicCodeMonitor({
            enableRealTimeMonitoring: true,
            enableAutoFix: true,
            enableLogging: true,
            monitorInterval: 2000
        });
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicCodeMonitor;
}

// Exportar para ES6
if (typeof window !== 'undefined') {
    window.DynamicCodeMonitor = DynamicCodeMonitor;
}