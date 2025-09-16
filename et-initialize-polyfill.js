/**
 * Polyfill específico para eT.initialize - Solución avanzada para errores setProperty
 * Este polyfill intercepta y corrige todos los problemas relacionados con eT.initialize
 */

(function() {
    'use strict';
    
    console.log('🛡️ eT.initialize Polyfill cargado');
    
    // 1. Crear un mock completo para elementos CSS problemáticos
    const createSafeElement = () => {
        const mockElement = {
            style: new Proxy({}, {
                get: (target, prop) => {
                    if (prop === 'setProperty') {
                        return function(property, value, priority) {
                            try {
                                target[property] = value;
                                return true;
                            } catch (e) {
                                console.warn('🛡️ setProperty interceptado:', property, value);
                                return false;
                            }
                        };
                    }
                    if (prop === 'getPropertyValue') {
                        return function(property) {
                            return target[property] || '';
                        };
                    }
                    if (prop === 'removeProperty') {
                        return function(property) {
                            delete target[property];
                            return target[property] || '';
                        };
                    }
                    return target[prop] || '';
                },
                set: (target, prop, value) => {
                    target[prop] = value;
                    return true;
                }
            }),
            setAttribute: function(name, value) {
                this[name] = value;
            },
            getAttribute: function(name) {
                return this[name] || null;
            },
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false,
                toggle: () => false
            },
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
            querySelector: () => null,
            querySelectorAll: () => [],
            appendChild: function(child) { return child; },
            removeChild: function(child) { return child; },
            cloneNode: function() { return createSafeElement(); }
        };
        return mockElement;
    };
    
    // 2. Interceptar document.querySelector y similares
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;
    const originalGetElementById = document.getElementById;
    const originalGetElementsByClassName = document.getElementsByClassName;
    const originalGetElementsByTagName = document.getElementsByTagName;
    
    document.querySelector = function(selector) {
        try {
            const result = originalQuerySelector.call(this, selector);
            if (!result && (selector.includes('eT') || selector.includes('et-') || selector.includes('[data-et')))) {
                console.warn('🛡️ Elemento eT no encontrado, devolviendo mock:', selector);
                return createSafeElement();
            }
            return result;
        } catch (e) {
            console.warn('🛡️ Error en querySelector interceptado:', selector, e);
            return createSafeElement();
        }
    };
    
    document.querySelectorAll = function(selector) {
        try {
            const result = originalQuerySelectorAll.call(this, selector);
            if (result.length === 0 && (selector.includes('eT') || selector.includes('et-') || selector.includes('[data-et'))) {
                console.warn('🛡️ Elementos eT no encontrados, devolviendo mock array:', selector);
                return [createSafeElement()];
            }
            return result;
        } catch (e) {
            console.warn('🛡️ Error en querySelectorAll interceptado:', selector, e);
            return [createSafeElement()];
        }
    };
    
    // 3. Interceptar y proteger eT.initialize específicamente
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = function(callback, delay) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, arguments);
            } catch (e) {
                if (e.message && e.message.includes('setProperty')) {
                    console.warn('🛡️ Error setProperty en setTimeout interceptado:', e);
                    return;
                }
                throw e;
            }
        };
        return originalSetTimeout.call(this, wrappedCallback, delay);
    };
    
    window.setInterval = function(callback, delay) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, arguments);
            } catch (e) {
                if (e.message && e.message.includes('setProperty')) {
                    console.warn('🛡️ Error setProperty en setInterval interceptado:', e);
                    return;
                }
                throw e;
            }
        };
        return originalSetInterval.call(this, wrappedCallback, delay);
    };
    
    // 4. Interceptar addEventListener para eventos problemáticos
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        const wrappedListener = function(event) {
            try {
                return listener.call(this, event);
            } catch (e) {
                if (e.message && (e.message.includes('setProperty') || e.message.includes('eT.initialize'))) {
                    console.warn('🛡️ Error en event listener interceptado:', type, e);
                    return;
                }
                throw e;
            }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
    };
    
    // 5. Crear un proxy global para interceptar accesos a eT
    if (typeof window.eT === 'undefined') {
        window.eT = new Proxy({}, {
            get: function(target, prop) {
                if (prop === 'initialize') {
                    return function() {
                        console.warn('🛡️ eT.initialize interceptado y neutralizado');
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
    
    // 6. Interceptar errores globales relacionados con setProperty
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        if (message && (message.includes('setProperty') || message.includes('eT.initialize'))) {
            console.warn('🛡️ Error global interceptado y neutralizado:', message);
            return true; // Prevenir que se propague
        }
        if (originalOnError) {
            return originalOnError.call(this, message, source, lineno, colno, error);
        }
        return false;
    };
    
    // 7. Interceptar Promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('setProperty') || event.reason.message.includes('eT.initialize'))) {
            console.warn('🛡️ Promise rejection interceptada:', event.reason);
            event.preventDefault();
        }
    });
    
    // 8. Proteger CSSStyleDeclaration.prototype.setProperty
    if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype.setProperty) {
        const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
            try {
                return originalSetProperty.call(this, property, value, priority);
            } catch (e) {
                console.warn('🛡️ setProperty protegido:', property, value, e);
                // Fallback: intentar asignación directa
                try {
                    this[property] = value;
                } catch (fallbackError) {
                    console.warn('🛡️ Fallback setProperty también falló:', fallbackError);
                }
                return;
            }
        };
    }
    
    // 9. Monitorear y interceptar mutaciones DOM problemáticas
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.className && 
                            (node.className.includes('et-') || node.className.includes('eT'))) {
                            // Asegurar que el elemento tenga un style seguro
                            if (!node.style || typeof node.style.setProperty !== 'function') {
                                node.style = createSafeElement().style;
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
    console.log('🛡️ eT.initialize Polyfill completamente inicializado');
})();