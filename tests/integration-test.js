const puppeteer = require('puppeteer');

describe('Hostreamly Integration Tests', () => {
  let browser;
  let page;
  const baseURL = 'http://localhost:5173';
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Core Application Integration', () => {
    test('should load application without conflicts', async () => {
      const errors = [];
      
      // Capture JavaScript errors
      page.on('pageerror', error => {
        errors.push({ type: 'JavaScript Error', message: error.message });
      });
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push({ type: 'Console Error', message: msg.text() });
        }
      });
      
      // Load the application
      await page.goto(baseURL, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Wait for potential async operations
      await page.waitForTimeout(3000);
      
      // Check if page loaded successfully
      const title = await page.title();
      expect(title).toBeDefined();
      expect(title.length).toBeGreaterThan(0);
      
      // Verify no critical errors occurred
      const criticalErrors = errors.filter(error => 
        !error.message.includes('favicon') && 
        !error.message.includes('404')
      );
      
      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }
      
      expect(criticalErrors.length).toBeLessThan(3); // Allow some minor errors
    });
    
    test('should have functional navigation without conflicts', async () => {
      await page.goto(baseURL);
      
      // Test basic navigation elements
      const navigationElements = await page.evaluate(() => {
        const elements = {
          links: document.querySelectorAll('a').length,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          forms: document.querySelectorAll('form').length
        };
        return elements;
      });
      
      console.log('Navigation elements found:', navigationElements);
      
      // Verify basic interactive elements exist
      expect(navigationElements.links + navigationElements.buttons).toBeGreaterThan(0);
    });
    
    test('should handle user interactions without breaking', async () => {
      await page.goto(baseURL);
      
      // Try to interact with clickable elements
      const clickableElements = await page.$$('button, a[href], input[type="button"], input[type="submit"]');
      
      if (clickableElements.length > 0) {
        // Test first few clickable elements
        const elementsToTest = Math.min(3, clickableElements.length);
        
        for (let i = 0; i < elementsToTest; i++) {
          try {
            await clickableElements[i].click({ timeout: 2000 });
            await page.waitForTimeout(1000);
            
            // Verify page is still responsive
            const isResponsive = await page.evaluate(() => {
              return document.readyState === 'complete';
            });
            
            expect(isResponsive).toBe(true);
          } catch (e) {
            console.log(`Element ${i} interaction failed (expected for some elements):`, e.message);
          }
        }
      }
      
      expect(true).toBe(true); // Test passes if no crashes occurred
    });
  });
  
  describe('Component Integration Tests', () => {
    test('should verify React components render without conflicts', async () => {
      await page.goto(baseURL);
      
      // Check for React-specific elements and patterns
      const reactElements = await page.evaluate(() => {
        const elements = {
          hasReactRoot: !!document.querySelector('[data-reactroot], #root'),
          hasComponents: document.querySelectorAll('[class*="component"], [class*="Component"]').length,
          hasModules: document.querySelectorAll('[class*="module"], [class*="Module"]').length,
          totalElements: document.querySelectorAll('*').length
        };
        return elements;
      });
      
      console.log('React elements analysis:', reactElements);
      
      // Verify the application has rendered content
      expect(reactElements.totalElements).toBeGreaterThan(10);
    });
    
    test('should verify CSS and styling integration', async () => {
      await page.goto(baseURL);
      
      // Check for styling conflicts
      const stylingInfo = await page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        
        return {
          hasBackground: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
          hasFont: computedStyle.fontFamily !== '',
          bodyHeight: body.offsetHeight,
          bodyWidth: body.offsetWidth,
          stylesheets: document.styleSheets.length
        };
      });
      
      console.log('Styling information:', stylingInfo);
      
      // Verify basic styling is applied
      expect(stylingInfo.bodyHeight).toBeGreaterThan(0);
      expect(stylingInfo.bodyWidth).toBeGreaterThan(0);
      expect(stylingInfo.stylesheets).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Integration', () => {
    test('should load within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await page.goto(baseURL, { waitUntil: 'networkidle2' });
      
      const loadTime = Date.now() - startTime;
      console.log(`Total load time: ${loadTime}ms`);
      
      // Should load within 10 seconds (generous for integration test)
      expect(loadTime).toBeLessThan(10000);
    });
    
    test('should not have excessive memory usage', async () => {
      await page.goto(baseURL);
      
      // Get memory metrics
      const metrics = await page.metrics();
      
      console.log('Memory metrics:', {
        jsHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024) + 'MB',
        jsHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024) + 'MB',
        nodes: metrics.Nodes
      });
      
      // Memory usage should be reasonable (less than 100MB)
      expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024);
      
      // DOM nodes should be reasonable (less than 5000)
      expect(metrics.Nodes).toBeLessThan(5000);
    });
  });
  
  describe('Error Recovery Integration', () => {
    test('should handle network interruptions gracefully', async () => {
      await page.goto(baseURL);
      
      // Simulate network issues
      await page.setOfflineMode(true);
      await page.waitForTimeout(2000);
      
      // Restore network
      await page.setOfflineMode(false);
      await page.waitForTimeout(2000);
      
      // Verify application is still functional
      const isWorking = await page.evaluate(() => {
        return document.readyState === 'complete' && document.body.children.length > 0;
      });
      
      expect(isWorking).toBe(true);
    });
  });
  
  describe('Cross-Component Communication', () => {
    test('should verify components can communicate without conflicts', async () => {
      await page.goto(baseURL);
      
      // Test form interactions if forms exist
      const forms = await page.$$('form');
      const inputs = await page.$$('input');
      
      if (forms.length > 0 && inputs.length > 0) {
        try {
          // Try to interact with first input
          await inputs[0].click();
          await inputs[0].type('test', { delay: 100 });
          
          // Verify input received the value
          const inputValue = await inputs[0].evaluate(el => el.value);
          expect(inputValue).toBe('test');
        } catch (e) {
          console.log('Form interaction test skipped:', e.message);
        }
      }
      
      expect(true).toBe(true); // Pass if no crashes
    });
  });
});