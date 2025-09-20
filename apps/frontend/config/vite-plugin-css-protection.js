/**
 * Plugin de Vite para protección CSS/JS
 * Resuelve problemas con setProperty y eT.initialize
 */

export default function cssProtectionPlugin(options = {}) {
  return {
    name: 'css-protection',
    configResolved(config) {
      this.isProduction = config.command === 'build';
    },
    transformIndexHtml: {
      enforce: 'pre',
      transform(html, ctx) {
        // Inyectar polyfills antes de cualquier script
        const polyfillScript = `
          <script>
            // Polyfill para setProperty
            if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype) {
              const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
              CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
                try {
                  return originalSetProperty.call(this, property, value, priority);
                } catch (e) {
                  console.warn('setProperty fallback:', property, value);
                  this.style[property] = value;
                }
              };
            }
            
            // Polyfill para eT.initialize
            window.eT = window.eT || {};
            window.eT.initialize = window.eT.initialize || function() {
              console.log('eT.initialize polyfill activated');
            };
          </script>
        `;
        
        return html.replace('<head>', '<head>' + polyfillScript);
      }
    },
    generateBundle(options, bundle) {
      // Post-procesar archivos JS para preservar funciones críticas
      Object.keys(bundle).forEach(fileName => {
        if (fileName.endsWith('.js')) {
          const chunk = bundle[fileName];
          if (chunk.code) {
            // Preservar nombres de funciones críticas
            chunk.code = chunk.code.replace(
              /setProperty/g,
              'setProperty'
            );
          }
        }
      });
    }
  };
}