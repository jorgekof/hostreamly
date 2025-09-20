// Debug utilities for development

/**
 * Initialize debug helpers for development environment
 */
export function initDebugHelpers(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🔍 Initializing debug helpers for Hostreamly');

  // Add global debug utilities
  (window as any).hostreamlyDebug = {
    performance: createPerformanceDebugger(),
    css: createCSSDebugger(),
    components: createComponentDebugger(),
    network: createNetworkDebugger()
  };

  // Log available debug commands
  console.log('Available debug commands:');
  console.log('- window.hostreamlyDebug.performance.report()');
  console.log('- window.hostreamlyDebug.css.inspect()');
  console.log('- window.hostreamlyDebug.components.list()');
  console.log('- window.hostreamlyDebug.network.monitor()');
}

/**
 * Create performance debugger
 */
function createPerformanceDebugger() {
  const metrics: { [key: string]: number[] } = {};

  return {
    mark: (name: string) => {
      performance.mark(name);
    },
    
    measure: (name: string, startMark: string, endMark?: string) => {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (!metrics[name]) metrics[name] = [];
        metrics[name].push(measure.duration);
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    },
    
    report: () => {
      console.group('🚀 Performance Report');
      
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('Page Load Metrics:');
        console.log(`- DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
        console.log(`- Load Complete: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
        console.log(`- First Paint: ${navigation.responseEnd - navigation.requestStart}ms`);
      }
      
      // Custom metrics
      if (Object.keys(metrics).length > 0) {
        console.log('\nCustom Metrics:');
        Object.entries(metrics).forEach(([name, values]) => {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          console.log(`- ${name}: ${avg.toFixed(2)}ms (${values.length} samples)`);
        });
      }
      
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('\nMemory Usage:');
        console.log(`- Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
        console.log(`- Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
        console.log(`- Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
      }
      
      console.groupEnd();
    }
  };
}

/**
 * Create CSS debugger
 */
function createCSSDebugger() {
  return {
    inspect: () => {
      console.group('🎨 CSS Debug Info');
      
      // Check CSS support
      const features = {
        'CSS Grid': CSS.supports('display', 'grid'),
        'CSS Flexbox': CSS.supports('display', 'flex'),
        'CSS Custom Properties': CSS.supports('color', 'var(--test)'),
        'CSS Transforms': CSS.supports('transform', 'translateX(10px)'),
        'CSS Animations': CSS.supports('animation-name', 'test'),
        'Modern Colors': CSS.supports('color', 'oklch(0.5 0.2 180)')
      };
      
      console.log('CSS Feature Support:');
      Object.entries(features).forEach(([feature, supported]) => {
        console.log(`- ${feature}: ${supported ? '✅' : '❌'}`);
      });
      
      // List loaded stylesheets
      const stylesheets = Array.from(document.styleSheets);
      console.log(`\nLoaded Stylesheets: ${stylesheets.length}`);
      stylesheets.forEach((sheet, index) => {
        console.log(`- ${index + 1}: ${sheet.href || 'inline'}`);
      });
      
      console.groupEnd();
    },
    
    findUnusedRules: () => {
      // Simple unused CSS detection (development only)
      console.log('🔍 Scanning for unused CSS rules...');
      // Implementation would go here
    }
  };
}

/**
 * Create component debugger
 */
function createComponentDebugger() {
  const componentRegistry = new Set<string>();
  
  return {
    register: (name: string) => {
      componentRegistry.add(name);
    },
    
    list: () => {
      console.group('🧩 React Components');
      console.log('Registered Components:');
      Array.from(componentRegistry).sort().forEach(name => {
        console.log(`- ${name}`);
      });
      console.groupEnd();
    },
    
    profile: (componentName: string) => {
      console.log(`📊 Profiling component: ${componentName}`);
      // React DevTools integration would go here
    }
  };
}

/**
 * Create network debugger
 */
function createNetworkDebugger() {
  const requests: any[] = [];
  
  return {
    monitor: () => {
      console.log('🌐 Starting network monitoring...');
      
      // Monitor fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = performance.now();
        const url = args[0] as string;
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          requests.push({
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration: endTime - startTime,
            timestamp: new Date().toISOString()
          });
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          
          requests.push({
            url,
            method: args[1]?.method || 'GET',
            status: 'ERROR',
            duration: endTime - startTime,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          throw error;
        }
      };
    },
    
    report: () => {
      console.group('🌐 Network Report');
      console.table(requests);
      console.groupEnd();
    },
    
    clear: () => {
      requests.length = 0;
      console.log('🧹 Network monitoring data cleared');
    }
  };
}

/**
 * Clean up debug helpers
 */
export function cleanupDebugHelpers(): void {
  if (typeof window !== 'undefined') {
    delete (window as any).hostreamlyDebug;
  }
}