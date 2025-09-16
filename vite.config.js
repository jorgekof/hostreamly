import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import cssProtectionPlugin from './config/vite-plugin-css-protection.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssProtectionPlugin({
      enablePolyfill: true,
      enableBundlePatching: true,
      enableRuntimeProtection: true,
      verbose: true // Para debugging
    })
  ],
  
  // Configuración de build optimizada
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Optimización de minificación
    minify: 'terser',
    terserOptions: {
      keep_fnames: /^(eT|initialize|setProperty)$/,
      mangle: {
        reserved: ['eT', 'initialize', 'setProperty'],
        properties: false
      },
      compress: {
        // Optimizaciones de producción
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true
      },
      format: {
        comments: false
      }
    },
    
    // Configuración avanzada de chunks
    rollupOptions: {
      output: {
        // Estrategia de chunking optimizada
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            if (id.includes('axios') || id.includes('socket.io')) {
              return 'network-vendor';
            }
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('/components/')) {
            return 'components';
          }
          if (id.includes('/pages/') || id.includes('/views/')) {
            return 'pages';
          }
          if (id.includes('/utils/') || id.includes('/helpers/')) {
            return 'utils';
          }
        },
        
        // Optimización de nombres de archivos
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '') : 'chunk';
          return `js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        entryFileNames: `js/[name]-[hash].js`
      },
      
      // Optimizaciones de external
      external: (id) => {
        // No externalizar nada en build normal
        return false;
      }
    },
    
    // Configuración de assets
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true,
    
    // Source maps condicionales
    sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden',
    
    // Configuración de reportes
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    
    // Configuración de proxy para API
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true // WebSocket support
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    },
    
    // Configuración de HMR
    hmr: {
      overlay: true
    },
    
    // Configuración de headers de seguridad
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Configuración de preview
  preview: {
    port: 4173,
    host: true,
    open: true,
    cors: true,
    
    // Proxy para preview también
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Resolver alias optimizado
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@assets': '/src/assets',
      '@styles': '/src/styles'
    },
    
    // Extensiones de archivo
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  
  // Optimizaciones de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'framer-motion'
    ],
    exclude: [
      // Excluir dependencias que causan problemas
    ],
    
    // Configuración de esbuild
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'top-level-await': true
      }
    }
  },
  
  // Configuración de CSS
  css: {
    devSourcemap: true,
    
    // Configuración de preprocessores
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/variables.scss";`
      }
    },
    
    // Configuración de PostCSS
    postcss: {
      plugins: [
        // Autoprefixer se añadirá automáticamente
      ]
    }
  },
  
  // Variables de entorno
  define: {
    __CSS_PROTECTION_ENABLED__: true,
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  // Configuración de worker
  worker: {
    format: 'es'
  },
  
  // Configuración de JSON
  json: {
    namedExports: true,
    stringify: false
  }
});