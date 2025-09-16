// CSS Polyfill for older browsers and custom property support

/**
 * Initialize CSS polyfill for better browser compatibility
 */
export function initCSSPolyfill(): void {
  if (typeof window === 'undefined') return;

  // Check if CSS custom properties are supported
  const supportsCustomProperties = window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--test)');
  
  if (!supportsCustomProperties) {
    console.log('🔧 Initializing CSS custom properties polyfill');
    loadCSSPolyfill();
  }

  // Check if CSS Grid is supported
  const supportsGrid = window.CSS && window.CSS.supports && window.CSS.supports('display', 'grid');
  
  if (!supportsGrid) {
    console.log('🔧 CSS Grid not supported, applying fallbacks');
    applyCSSGridFallbacks();
  }

  // Check if modern color functions are supported
  const supportsModernColors = window.CSS && window.CSS.supports && window.CSS.supports('color', 'oklch(0.5 0.2 180)');
  
  if (!supportsModernColors) {
    console.log('🔧 Modern color functions not supported, applying fallbacks');
    applyColorFallbacks();
  }
}

/**
 * Load CSS custom properties polyfill
 */
function loadCSSPolyfill(): void {
  // Simple polyfill for CSS custom properties
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --brand-primary: #ff6b35;
      --brand-secondary: #6a0dad;
      --brand-accent: #39ff14;
      --background: #ffffff;
      --foreground: #0f172a;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --input: #e2e8f0;
      --ring: #ff6b35;
    }
    
    .bg-brand-primary { background-color: #ff6b35; }
    .bg-brand-secondary { background-color: #6a0dad; }
    .bg-brand-accent { background-color: #39ff14; }
    .text-brand-primary { color: #ff6b35; }
    .text-brand-secondary { color: #6a0dad; }
    .text-brand-accent { color: #39ff14; }
    .border-brand-primary { border-color: #ff6b35; }
    .border-brand-secondary { border-color: #6a0dad; }
    .border-brand-accent { border-color: #39ff14; }
  `;
  document.head.appendChild(style);
}

/**
 * Apply CSS Grid fallbacks for older browsers
 */
function applyCSSGridFallbacks(): void {
  const style = document.createElement('style');
  style.textContent = `
    .grid {
      display: flex;
      flex-wrap: wrap;
    }
    
    .grid-cols-1 > * { width: 100%; }
    .grid-cols-2 > * { width: 50%; }
    .grid-cols-3 > * { width: 33.333333%; }
    .grid-cols-4 > * { width: 25%; }
    .grid-cols-6 > * { width: 16.666667%; }
    
    @media (max-width: 768px) {
      .md\\:grid-cols-2 > * { width: 50%; }
      .md\\:grid-cols-3 > * { width: 33.333333%; }
      .md\\:grid-cols-4 > * { width: 25%; }
    }
    
    @media (max-width: 640px) {
      .sm\\:grid-cols-1 > * { width: 100%; }
      .sm\\:grid-cols-2 > * { width: 50%; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Apply color fallbacks for browsers that don't support modern color functions
 */
function applyColorFallbacks(): void {
  const style = document.createElement('style');
  style.textContent = `
    .bg-gradient-to-r,
    .bg-gradient-to-br,
    .bg-gradient-to-t {
      background: linear-gradient(45deg, #ff6b35, #6a0dad, #39ff14);
    }
    
    .bg-gradient-primary {
      background: linear-gradient(135deg, #ff6b35, #ff8c42);
    }
    
    .bg-gradient-secondary {
      background: linear-gradient(135deg, #6a0dad, #8a2be2);
    }
    
    .shadow-glow {
      box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
    }
    
    .shadow-electric {
      box-shadow: 0 0 30px rgba(57, 255, 20, 0.4);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Clean up polyfill resources
 */
export function cleanupCSSPolyfill(): void {
  // Remove polyfill styles if needed
  const polyfillStyles = document.querySelectorAll('style[data-css-polyfill]');
  polyfillStyles.forEach(style => style.remove());
}

/**
 * Check if setProperty errors occur
 */
export function checkSetPropertyErrors(): boolean {
  try {
    const testElement = document.createElement('div');
    testElement.style.setProperty('--test', 'value');
    return true;
  } catch (error) {
    console.warn('CSS setProperty not fully supported:', error);
    return false;
  }
}

/**
 * Safe setProperty wrapper
 */
export function safeSetProperty(element: HTMLElement, property: string, value: string): void {
  try {
    element.style.setProperty(property, value);
  } catch (error) {
    console.warn(`Failed to set CSS property ${property}:`, error);
    // Fallback to direct style assignment for known properties
    if (property.startsWith('--')) {
      // Skip custom properties on unsupported browsers
      return;
    }
    
    // Convert kebab-case to camelCase for direct assignment
    const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    if (camelCase in element.style) {
      (element.style as any)[camelCase] = value;
    }
  }
}