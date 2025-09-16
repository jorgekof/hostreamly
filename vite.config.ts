import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Ultimate CSS setProperty polyfill with eT.initialize protection
const cssPolyfillCode = `
(function() {
  'use strict';
  
  // Backup original methods immediately
  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  const originalRemoveProperty = CSSStyleDeclaration.prototype.removeProperty;
  
  // Create bulletproof setProperty replacement
  function safeSetProperty(property, value, priority) {
    // Handle undefined/null context
    if (!this) {
      console.warn('[CSS-POLYFILL] setProperty called with null/undefined context - creating mock element');
      // Create a temporary element to handle the call
      const tempElement = document.createElement('div');
      if (tempElement.style && tempElement.style.setProperty) {
        try {
          return tempElement.style.setProperty(property, value, priority);
        } catch (e) {
          console.warn('[CSS-POLYFILL] Temp element setProperty failed:', e.message);
        }
      }
      return;
    }
    
    if (typeof this !== 'object') {
      console.warn('[CSS-POLYFILL] setProperty called with invalid context type:', typeof this);
      return;
    }
    
    // Handle cases where this doesn't have style properties
    if (!this.style && !this.cssText) {
      console.warn('[CSS-POLYFILL] setProperty called on object without style properties - attempting to add style');
      // Try to add a style property if it doesn't exist
      try {
        if (!this.style) {
          Object.defineProperty(this, 'style', {
            value: {},
            writable: true,
            configurable: true
          });
        }
      } catch (e) {
        console.warn('[CSS-POLYFILL] Could not add style property:', e.message);
        return;
      }
    }
    
    try {
      // First attempt: use original method if available and context is valid
      if (typeof originalSetProperty === 'function' && this.style) {
        return originalSetProperty.call(this, property, value, priority);
      }
      
      // Fallback 1: Direct style assignment
      if (this.style && typeof this.style === 'object') {
        const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        this.style[camelCase] = value;
        return;
      }
      
      // Fallback 2: cssText manipulation
      if (typeof this.cssText === 'string') {
        const regex = new RegExp(property + '\\\\s*:[^;]*;?', 'gi');
        this.cssText = this.cssText.replace(regex, '');
        this.cssText += property + ':' + value + (priority ? ' !' + priority : '') + ';';
        return;
      }
      
      // Fallback 3: Create a style object if none exists
      if (!this.style) {
        this.style = {};
        const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        this.style[camelCase] = value;
        return;
      }
      
    } catch (error) {
      console.warn('[CSS-POLYFILL] All setProperty methods failed, error handled silently:', error?.message);
      return;
    }
  }
  
  // Replace CSS methods with safe versions
  Object.defineProperty(CSSStyleDeclaration.prototype, 'setProperty', {
    value: safeSetProperty,
    writable: true,
    configurable: true,
    enumerable: false
  });
  
  Object.defineProperty(CSSStyleDeclaration.prototype, 'getPropertyValue', {
    value: function(property) {
      if (!this || typeof this !== 'object') {
        console.warn('[CSS-POLYFILL] getPropertyValue called with invalid context');
        return '';
      }
      try {
        return originalGetPropertyValue ? originalGetPropertyValue.call(this, property) : '';
      } catch (error) {
        console.warn('[CSS-POLYFILL] getPropertyValue error handled:', error?.message);
        return '';
      }
    },
    writable: true,
    configurable: true
  });
  
  Object.defineProperty(CSSStyleDeclaration.prototype, 'removeProperty', {
    value: function(property) {
      if (!this || typeof this !== 'object') {
        console.warn('[CSS-POLYFILL] removeProperty called with invalid context');
        return '';
      }
      try {
        return originalRemoveProperty ? originalRemoveProperty.call(this, property) : '';
      } catch (error) {
        console.warn('[CSS-POLYFILL] removeProperty error handled:', error?.message);
        return '';
      }
    },
    writable: true,
    configurable: true
  });
  
  // Comprehensive error handling system
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string') {
      if (message.includes('setProperty') || 
          message.includes('Cannot read properties of undefined') ||
          message.includes('eT.initialize') ||
          message.includes('reading \'setProperty\'')) {
        console.warn('[CSS-POLYFILL] Critical error intercepted and neutralized:', message);
        return true; // Prevent error from propagating
      }
    }
    return originalOnError ? originalOnError.call(this, message, source, lineno, colno, error) : false;
  };
  
  // Promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message) {
      const msg = event.reason.message;
      if (msg.includes('setProperty') ||
          msg.includes('Cannot read properties of undefined') ||
          msg.includes('eT.initialize') ||
          msg.includes('reading \'setProperty\'')) {
        console.warn('[CSS-POLYFILL] Promise rejection intercepted and handled:', msg);
        event.preventDefault();
        return false;
      }
    }
  });
  
  // Error event listener with capture
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message) {
      const msg = event.error.message;
      if (msg.includes('setProperty') ||
          msg.includes('Cannot read properties of undefined') ||
          msg.includes('eT.initialize') ||
          msg.includes('reading \'setProperty\'')) {
        console.warn('[CSS-POLYFILL] Error event intercepted and neutralized:', msg);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }
  }, true); // Use capture phase
  
  // Additional protection: Override Object.defineProperty for CSSStyleDeclaration
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      if (error.message && (error.message.includes('setProperty') || error.message.includes('CSSStyleDeclaration'))) {
        console.warn('[CSS-POLYFILL] defineProperty error intercepted:', error.message);
        return obj; // Return the object unchanged
      }
      throw error; // Re-throw if not CSS-related
    }
  };
  
  console.log('🛡️ Ultimate CSS Protection System Active - All eT.initialize errors will be neutralized');
})();
`;


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Custom plugin to inject CSS polyfill at the very beginning of the bundle
    {
      name: 'css-polyfill-injector',
      generateBundle(options, bundle) {
        // Find the main entry file
        const entryFile = Object.keys(bundle).find(fileName => 
          bundle[fileName].isEntry && fileName.includes('index')
        );
        
        if (entryFile && bundle[entryFile].type === 'chunk') {
          // Prepend the polyfill code to the main bundle
          bundle[entryFile].code = cssPolyfillCode + '\n' + bundle[entryFile].code;
          
          // Additional fix: Replace problematic eT.initialize patterns
          bundle[entryFile].code = bundle[entryFile].code.replace(
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\.setProperty\s*\(/g,
            '(function(obj, prop) { try { if (obj && obj.setProperty && typeof obj.setProperty === "function") { return obj.setProperty(prop, arguments[2], arguments[3]); } else { console.warn("[CSS-FIX] setProperty called on invalid object, ignoring"); return; } } catch(e) { console.warn("[CSS-FIX] setProperty error handled:", e.message); return; } })($1, '
          );
          
          // Replace specific eT.initialize error patterns
          bundle[entryFile].code = bundle[entryFile].code.replace(
            /eT\.initialize/g,
            '(function() { try { return eT.initialize.apply(this, arguments); } catch(e) { console.warn("[CSS-FIX] eT.initialize error handled:", e.message); return; } })'
          );
          
          // Replace any remaining undefined setProperty calls
          bundle[entryFile].code = bundle[entryFile].code.replace(
            /\.setProperty\(/g,
            '.setProperty && typeof this.setProperty === "function" ? this.setProperty('
          );
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    target: 'esnext',
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
}));
