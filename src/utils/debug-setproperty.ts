/**
 * Advanced debugging script to identify the source of setProperty errors
 * This script intercepts and analyzes setProperty calls to find the problematic library
 */

// Store original methods
const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;

// Error tracking
interface SetPropertyError {
  timestamp: number;
  error: Error;
  stackTrace: string;
  context: string;
  element?: Element;
  property?: string;
  value?: string;
  priority?: string;
}

const setPropertyErrors: SetPropertyError[] = [];

/**
 * Extract library information from stack trace
 */
function analyzeStackTrace(stack: string): { library: string; file: string; line: number } {
  const lines = stack.split('\n');
  
  for (const line of lines) {
    // Look for common patterns in minified code
    const patterns = [
      /at\s+([a-zA-Z]+)\s+\(.*?([^/\\]+\.js):(\d+):(\d+)\)/,
      /at\s+.*?([^/\\]+\.js):(\d+):(\d+)/,
      /@.*?([^/\\]+\.js):(\d+):(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const file = match[match.length - 3] || 'unknown';
        const lineNum = parseInt(match[match.length - 2]) || 0;
        
        // Try to identify the library based on file patterns
        let library = 'unknown';
        if (file.includes('react')) library = 'React';
        else if (file.includes('radix')) library = 'Radix UI';
        else if (file.includes('framer')) library = 'Framer Motion';
        else if (file.includes('emotion')) library = 'Emotion';
        else if (file.includes('styled')) library = 'Styled Components';
        else if (file.includes('mui')) library = 'Material UI';
        else if (file.includes('antd')) library = 'Ant Design';
        else if (file.includes('chakra')) library = 'Chakra UI';
        else if (file.includes('mantine')) library = 'Mantine';
        else if (file.includes('vendor') || file.includes('chunk')) library = 'Third Party Bundle';
        else if (file.includes('index') || file.includes('main')) library = 'Main Application';
        
        return { library, file, line: lineNum };
      }
    }
  }
  
  return { library: 'unknown', file: 'unknown', line: 0 };
}

/**
 * Enhanced setProperty interceptor with detailed logging
 */
function interceptSetProperty() {
  CSSStyleDeclaration.prototype.setProperty = function(property: string, value: string, priority?: string) {
    try {
      // Check if this is null or undefined
      if (this == null) {
        const error = new Error(`setProperty called on null/undefined object`);
        const analysis = analyzeStackTrace(error.stack || '');
        
        const errorInfo: SetPropertyError = {
          timestamp: Date.now(),
          error,
          stackTrace: error.stack || '',
          context: 'null/undefined this',
          property,
          value,
          priority
        };
        
        setPropertyErrors.push(errorInfo);
        
        console.group('🚨 SetProperty Error Detected');
        console.error('Error:', error.message);
        console.log('Library:', analysis.library);
        console.log('File:', analysis.file);
        console.log('Line:', analysis.line);
        console.log('Property:', property);
        console.log('Value:', value);
        console.log('Priority:', priority);
        console.log('Stack Trace:', error.stack);
        console.groupEnd();
        
        // Try to provide a fallback
        return;
      }
      
      // Call original method
      return originalSetProperty.call(this, property, value, priority);
    } catch (error) {
      const analysis = analyzeStackTrace((error as Error).stack || '');
      
      const errorInfo: SetPropertyError = {
        timestamp: Date.now(),
        error: error as Error,
        stackTrace: (error as Error).stack || '',
        context: 'setProperty execution',
        element: this instanceof Element ? this : undefined,
        property,
        value,
        priority
      };
      
      setPropertyErrors.push(errorInfo);
      
      console.group('🚨 SetProperty Execution Error');
      console.error('Error:', (error as Error).message);
      console.log('Library:', analysis.library);
      console.log('File:', analysis.file);
      console.log('Line:', analysis.line);
      console.log('Element:', this);
      console.log('Property:', property);
      console.log('Value:', value);
      console.log('Priority:', priority);
      console.log('Stack Trace:', (error as Error).stack);
      console.groupEnd();
      
      // Don't throw, just log and continue
      return;
    }
  };
}

/**
 * Monitor document.documentElement.style access
 */
function interceptDocumentElementStyle() {
  const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
  
  if (originalDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'style', {
      get: function() {
        try {
          const style = originalDescriptor.get?.call(this);
          if (!style) {
            const error = new Error('Style property returned null/undefined');
            const analysis = analyzeStackTrace(error.stack || '');
            
            console.group('🚨 Style Access Error');
            console.error('Element style is null/undefined');
            console.log('Library:', analysis.library);
            console.log('File:', analysis.file);
            console.log('Element:', this);
            console.log('Stack Trace:', error.stack);
            console.groupEnd();
            
            // Return a mock style object
            return {
              setProperty: () => {},
              getPropertyValue: () => '',
              removeProperty: () => ''
            };
          }
          return style;
        } catch (error) {
          console.error('Error accessing style property:', error);
          return {
            setProperty: () => {},
            getPropertyValue: () => '',
            removeProperty: () => ''
          };
        }
      },
      set: originalDescriptor.set,
      configurable: true,
      enumerable: true
    });
  }
}

/**
 * Global error handler for uncaught errors
 */
function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('setProperty')) {
      const analysis = analyzeStackTrace(event.error.stack || '');
      
      console.group('🚨 Global SetProperty Error');
      console.error('Message:', event.error.message);
      console.log('Library:', analysis.library);
      console.log('File:', analysis.file);
      console.log('Line:', analysis.line);
      console.log('Source:', event.filename);
      console.log('Line Number:', event.lineno);
      console.log('Column:', event.colno);
      console.log('Stack Trace:', event.error.stack);
      console.groupEnd();
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('setProperty')) {
      const analysis = analyzeStackTrace(event.reason.stack || '');
      
      console.group('🚨 Unhandled Promise SetProperty Error');
      console.error('Reason:', event.reason.message);
      console.log('Library:', analysis.library);
      console.log('Stack Trace:', event.reason.stack);
      console.groupEnd();
    }
  });
}

/**
 * Generate debugging report
 */
function generateDebugReport(): string {
  const report = {
    timestamp: new Date().toISOString(),
    totalErrors: setPropertyErrors.length,
    errorsByLibrary: {} as Record<string, number>,
    errorsByFile: {} as Record<string, number>,
    recentErrors: setPropertyErrors.slice(-10),
    recommendations: [] as string[]
  };
  
  // Analyze errors by library and file
  setPropertyErrors.forEach(error => {
    const analysis = analyzeStackTrace(error.stackTrace);
    report.errorsByLibrary[analysis.library] = (report.errorsByLibrary[analysis.library] || 0) + 1;
    report.errorsByFile[analysis.file] = (report.errorsByFile[analysis.file] || 0) + 1;
  });
  
  // Generate recommendations
  const topLibrary = Object.entries(report.errorsByLibrary)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topLibrary) {
    report.recommendations.push(`Most errors come from: ${topLibrary[0]} (${topLibrary[1]} errors)`);
    
    if (topLibrary[0].includes('React')) {
      report.recommendations.push('Consider updating React and related packages');
    } else if (topLibrary[0].includes('Radix')) {
      report.recommendations.push('Check Radix UI version compatibility with React 18');
    } else if (topLibrary[0] === 'Third Party Bundle') {
      report.recommendations.push('Check third-party dependencies for CSS custom properties support');
    }
  }
  
  return JSON.stringify(report, null, 2);
}

/**
 * Initialize debugging system
 */
export function initializeSetPropertyDebugger() {
  console.log('🔍 Initializing SetProperty Debugger...');
  
  interceptSetProperty();
  interceptDocumentElementStyle();
  setupGlobalErrorHandler();
  
  // Add global debugging functions
  (window as any).debugSetProperty = {
    getErrors: () => setPropertyErrors,
    generateReport: generateDebugReport,
    clearErrors: () => setPropertyErrors.length = 0,
    analyzeStack: analyzeStackTrace
  };
  
  console.log('✅ SetProperty Debugger initialized');
  console.log('Use window.debugSetProperty.generateReport() to get a detailed report');
}

/**
 * Clean up debugging system
 */
export function cleanupSetPropertyDebugger() {
  CSSStyleDeclaration.prototype.setProperty = originalSetProperty;
  CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
  delete (window as any).debugSetProperty;
  console.log('🧹 SetProperty Debugger cleaned up');
}