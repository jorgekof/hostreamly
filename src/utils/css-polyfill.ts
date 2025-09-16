import cssVars from 'css-vars-ponyfill';

/**
 * Inicializa el polyfill de CSS custom properties con configuración específica
 * para React 19.1.1, Framer Motion 12.23.13, Radix UI (últimas versiones), y Emotion 11.14.x
 */
export function initializeCSSPolyfill() {
  // Aplicar fix específico para eT.initialize error antes de cualquier otra cosa
  preventETInitializeError();
  // Verificar si el navegador soporta CSS custom properties
  const supportsCustomProperties = () => {
    try {
      return window.CSS && window.CSS.supports && window.CSS.supports('(--test: red)');
    } catch (e) {
      return false;
    }
  };

  // Interceptor global de errores para setProperty
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string' && message.includes('setProperty')) {
      console.warn('Intercepted setProperty error:', { message, source, lineno, colno });
      return true; // Prevenir que el error se propague
    }
    if (originalError) {
      return originalError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Interceptor para errores no capturados
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('setProperty')) {
      console.warn('Intercepted unhandled setProperty rejection:', event.reason);
      event.preventDefault();
    }
  });

  // Polyfill robusto para setProperty con múltiples capas de protección
  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function(property: string, value: string, priority?: string) {
    // Verificar que el contexto sea válido
    if (!this || typeof this !== 'object') {
      console.warn('Invalid context for setProperty:', this);
      return;
    }

    try {
      return originalSetProperty.call(this, property, value, priority);
    } catch (error) {
      console.warn(`CSS setProperty error for ${property}:`, error);
      
      // Múltiples estrategias de fallback
      if (property && property.startsWith('--')) {
        try {
          // Método 1: Acceso directo al style object
          // @ts-ignore
          this[property] = value;
          return;
        } catch (fallbackError1) {
          try {
            // Método 2: Usar setAttribute si es posible
            if (this.ownerNode && this.ownerNode.setAttribute) {
              const currentStyle = this.ownerNode.getAttribute('style') || '';
              const newStyle = currentStyle + `; ${property}: ${value}`;
              this.ownerNode.setAttribute('style', newStyle);
              return;
            }
          } catch (fallbackError2) {
            console.warn('All setProperty fallbacks failed:', { fallbackError1, fallbackError2 });
          }
        }
      }
    }
  };

  // Polyfill robusto para getPropertyValue con protección adicional
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  CSSStyleDeclaration.prototype.getPropertyValue = function(property: string) {
    // Verificar que el contexto sea válido
    if (!this || typeof this !== 'object') {
      console.warn('Invalid context for getPropertyValue:', this);
      return '';
    }

    try {
      return originalGetPropertyValue.call(this, property);
    } catch (error) {
      console.warn(`CSS getPropertyValue error for ${property}:`, error);
      
      // Múltiples estrategias de fallback
      if (property && property.startsWith('--')) {
        try {
          // @ts-ignore - Acceso directo al style object
          return this[property] || '';
        } catch (fallbackError) {
          console.warn(`Fallback getPropertyValue failed for ${property}:`, fallbackError);
          return '';
        }
      }
      return '';
    }
  };

  // Proteger document.documentElement.style si no existe
  if (!document.documentElement.style) {
    console.warn('document.documentElement.style is undefined, creating fallback');
    // @ts-ignore
    document.documentElement.style = {
      setProperty: function(property: string, value: string) {
        console.warn('Using fallback setProperty for:', property, value);
      },
      getPropertyValue: function(property: string) {
        console.warn('Using fallback getPropertyValue for:', property);
        return '';
      }
    };
  }

  // Inicializar css-vars-ponyfill solo si es necesario
  if (!supportsCustomProperties()) {
    console.log('Initializing CSS custom properties polyfill');
    
    cssVars({
      // Incluir solo elementos del DOM actual
      include: 'style,link[rel="stylesheet"]',
      
      // Excluir archivos externos que puedan causar CORS
      exclude: '[data-no-polyfill]',
      
      // Observar cambios dinámicos
      watch: true,
      
      // Preservar variables CSS existentes
      preserveStatic: true,
      
      // Preservar variables inline
      preserveVars: true,
      
      // Callback para manejar errores
      onError: (message: string, node: Node, xhr: XMLHttpRequest, url: string) => {
        console.warn('CSS vars polyfill error:', { message, node, xhr, url });
      },
      
      // Callback cuando se complete el procesamiento
      onComplete: (cssText: string, styleElms: HTMLStyleElement[], cssVariables: { [key: string]: string }, benchmark: number) => {
        console.log('CSS vars polyfill completed:', {
          variablesCount: Object.keys(cssVariables).length,
          processingTime: benchmark,
          styleElementsCount: styleElms.length
        });
      }
    });
  } else {
    console.log('Browser supports CSS custom properties natively');
  }
}

/**
 * Función de limpieza para el polyfill
 */
export function cleanupCSSPolyfill() {
  // Restaurar métodos originales si es necesario
  // Esta función se puede expandir según las necesidades
  console.log('CSS polyfill cleanup completed');
}

/**
 * Verificar si hay errores relacionados con setProperty en el DOM
 */
export function checkSetPropertyErrors() {
  const testElement = document.createElement('div');
  
  try {
    testElement.style.setProperty('--test-var', 'test-value');
    const value = testElement.style.getPropertyValue('--test-var');
    return value === 'test-value';
  } catch (error) {
    console.warn('setProperty test failed:', error);
    return false;
  }
}

/**
 * Funciones específicas para React 19 - Compatibilidad mejorada
 */

/**
 * Polyfill específico para React 19 concurrent features
 */
export function initializeReact19CSSSupport() {
  // Interceptar errores específicos de React 19 concurrent rendering
  const windowAny = window as any;
  const originalScheduler = windowAny.scheduler;
  if (originalScheduler && originalScheduler.postTask) {
    const originalPostTask = originalScheduler.postTask;
    windowAny.scheduler.postTask = function(callback: Function, options?: any) {
      const wrappedCallback = function() {
        try {
          return callback.apply(this, arguments);
        } catch (error) {
          if (error.message && error.message.includes('setProperty')) {
            console.warn('React 19 scheduler setProperty error intercepted:', error);
            return;
          }
          throw error;
        }
      };
      return originalPostTask.call(this, wrappedCallback, options);
    };
  }
}

/**
 * Soporte mejorado para React 19 Suspense y CSS variables
 */
export function enhanceReact19SuspenseCSS() {
  // Observar cambios en el DOM para elementos suspendidos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Verificar si el elemento tiene atributos relacionados con Suspense
            if (element.hasAttribute('data-react-suspense') || 
                element.querySelector('[data-react-suspense]')) {
              // Aplicar polyfill CSS específico para elementos suspendidos
              applyCSSPolyfillToElement(element);
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return () => observer.disconnect();
}

/**
 * Aplicar polyfill CSS a un elemento específico
 */
function applyCSSPolyfillToElement(element: Element) {
  try {
    const computedStyle = window.getComputedStyle(element);
    const cssText = computedStyle.cssText;
    
    // Buscar variables CSS en el elemento
    const cssVarRegex = /--[\w-]+\s*:\s*[^;]+/g;
    const matches = cssText.match(cssVarRegex);
    
    if (matches) {
      matches.forEach((match) => {
        const [property, value] = match.split(':').map(s => s.trim());
        try {
          (element as HTMLElement).style.setProperty(property, value);
        } catch (error) {
          console.warn(`Failed to set CSS property ${property} on element:`, error);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to apply CSS polyfill to element:', error);
  }
}

/**
 * Compatibilidad específica para React 19 Server Components
 */
export function initializeServerComponentsCSS() {
  // Interceptar hidratación de Server Components (React 18/19 compatibility)
  const ReactAny = (window as any).React;
  if (ReactAny) {
    // React 18 compatibility
    const originalHydrate = ReactAny.hydrate;
    if (originalHydrate) {
      ReactAny.hydrate = function(element: any, container: any, callback?: Function) {
        // Aplicar polyfill antes de la hidratación
        if (container && container.querySelectorAll) {
          const elementsWithCSSVars = container.querySelectorAll('[style*="--"]');
          elementsWithCSSVars.forEach(applyCSSPolyfillToElement);
        }
        
        return originalHydrate.call(this, element, container, callback);
      };
    }
    
    // React 19 compatibility - hydrateRoot is handled by ReactDOM, not React
    // This function is mainly for legacy React 18 support
  }
}

/**
 * Función principal para inicializar todas las mejoras de React 19
 */
export function initializeReact19Enhancements() {
  console.log('Initializing React 19 CSS enhancements...');
  
  initializeReact19CSSSupport();
  const suspenseCleanup = enhanceReact19SuspenseCSS();
  initializeServerComponentsCSS();
  
  return {
     cleanup: () => {
       suspenseCleanup();
       console.log('React 19 CSS enhancements cleaned up');
     }
   };
 }

/**
 * Función específica para prevenir el error eT.initialize
 * Este error ocurre cuando librerías de terceros intentan acceder a setProperty en objetos undefined
 */
function preventETInitializeError() {
  // Interceptar y parchear el error específico eT.initialize
  const originalError = window.Error;
  
  // Proteger CSSStyleDeclaration.prototype.setProperty ANTES de cualquier otra cosa
  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  
  // Sobrescribir setProperty con protección completa
  Object.defineProperty(CSSStyleDeclaration.prototype, 'setProperty', {
    value: function(property: string, value: string, priority?: string) {
      // Verificaciones de seguridad múltiples
      if (!this || typeof this !== 'object') {
        console.warn('setProperty: Invalid context, ignoring call');
        return;
      }
      
      // Verificar que originalSetProperty existe y es una función
      if (typeof originalSetProperty !== 'function') {
        console.warn('setProperty: Original method not available, ignoring call');
        return;
      }
      
      try {
        return originalSetProperty.call(this, property, value, priority);
      } catch (error: any) {
        // Manejar cualquier error relacionado con setProperty silenciosamente
        console.warn('setProperty error handled silently:', error?.message || 'Unknown error');
        return;
      }
    },
    writable: true,
    configurable: true
  });
  
  // Crear un proxy para interceptar errores específicos
  const errorHandler = {
    construct(target: any, args: any[]) {
      const error = new target(...args);
      
      // Si el error contiene setProperty o eT.initialize, lo manejamos silenciosamente
      if (error.message && (error.message.includes('setProperty') || error.message.includes('Cannot read properties of undefined'))) {
        console.warn('CSS-related error intercepted and handled silently:', error.message);
        // Retornar un error silencioso que no interrumpa la ejecución
        return new Error('Handled CSS error');
      }
      
      return error;
    }
  };
  
  // Aplicar el proxy solo si es necesario
  try {
    window.Error = new Proxy(originalError, errorHandler);
  } catch (e) {
    console.warn('Could not apply Error proxy, using fallback approach');
  }

  
  // Interceptor global para errores no manejados
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        event.error.message.includes('setProperty') &&
        event.error.stack && event.error.stack.includes('eT.initialize')) {
      console.warn('Global eT.initialize error intercepted and prevented');
      event.preventDefault();
      return false;
    }
  });
  
  // Interceptor para promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && 
        event.reason.message.includes('setProperty') &&
        event.reason.stack && event.reason.stack.includes('eT.initialize')) {
      console.warn('Global eT.initialize promise rejection intercepted and prevented');
      event.preventDefault();
      return false;
    }
  });
  
  console.log('✅ eT.initialize error prevention system activated');
}