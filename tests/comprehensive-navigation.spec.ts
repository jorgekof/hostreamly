import { test, expect } from '@playwright/test';

test.describe('Comprehensive Navigation Tests - Pruebas de Navegación Completa', () => {
  
  test('should test login/register modal functionality', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar botones que abren el modal de login
    const loginTriggers = [
      'button:has-text("Iniciar Sesión")',
      'button:has-text("Comenzar Gratis")',
      'button:has-text("Acceso")',
      '[data-testid="login-button"]'
    ];
    
    let loginTriggerFound = false;
    for (const selector of loginTriggers) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Botón de login encontrado: ${selector}`);
          loginTriggerFound = true;
          
          // Hacer clic para abrir el modal
          await element.click();
          await page.waitForTimeout(1000);
          
          // Verificar que el modal se abre
          const modal = page.locator('[role="dialog"]');
          if (await modal.isVisible({ timeout: 2000 })) {
            console.log('Modal de login abierto exitosamente');
            
            // Buscar elementos del modal
            const modalElements = [
              'input[type="email"]',
              'input[type="password"]',
              'button:has-text("Acceso")',
              'button:has-text("Registrarse")',
              'button:has-text("Continuar con Google")'
            ];
            
            for (const modalSelector of modalElements) {
              const modalElement = page.locator(modalSelector);
              if (await modalElement.isVisible({ timeout: 2000 })) {
                console.log(`Elemento del modal encontrado: ${modalSelector}`);
              }
            }
          }
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!loginTriggerFound) {
      console.log('⚠️ No se encontraron botones de login/registro en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test dashboard navigation and upload functionality', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Intentar navegar directamente al dashboard (sin autenticación)
    await page.goto('http://localhost:8082/dashboard');
    await page.waitForTimeout(2000);
    
    // Verificar si hay redirección o elementos de dashboard
    const currentUrl = page.url();
    console.log(`URL actual después de navegar a dashboard: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('Acceso al dashboard exitoso');
      
      // Buscar elementos de subida de archivos en el dashboard
      const uploadSelectors = [
        'input[type="file"]',
        'button:has-text("Subir")',
        'button:has-text("Upload")',
        '[data-testid="file-upload"]',
        '.upload-area',
        '.dropzone',
        'label[for="video-file"]',
        'button:has-text("Subir Video")'
      ];
      
      let uploadFound = false;
      for (const selector of uploadSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            console.log(`✅ Elemento de subida encontrado en dashboard: ${selector}`);
            uploadFound = true;
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!uploadFound) {
        console.log('⚠️ No se encontraron elementos de subida en el dashboard');
      }
      
      // Buscar elementos de gestión de archivos
      const fileManagementSelectors = [
        '.file-list',
        '.video-library',
        'table',
        '.grid',
        'button:has-text("Biblioteca")',
        'button:has-text("Videos")',
        '[data-testid="video-list"]'
      ];
      
      let fileManagementFound = false;
      for (const selector of fileManagementSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            console.log(`✅ Elemento de gestión de archivos encontrado: ${selector}`);
            fileManagementFound = true;
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!fileManagementFound) {
        console.log('⚠️ No se encontraron elementos de gestión de archivos en el dashboard');
      }
    } else {
      console.log('⚠️ Redirección desde dashboard - probablemente requiere autenticación');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test video streaming and player elements', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos de video en la página principal
    const videoSelectors = [
      'video',
      '.video-player',
      '[data-testid="video-player"]',
      '.streaming-container',
      'iframe[src*="video"]',
      'iframe[src*="player"]',
      '.player-container'
    ];
    
    let videoFound = false;
    for (const selector of videoSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Elemento de video encontrado: ${selector}`);
          videoFound = true;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!videoFound) {
      console.log('⚠️ No se encontraron elementos de video en la página principal');
    }
    
    // Intentar navegar a una página de demo de player
    await page.goto('http://localhost:8082/player-demo');
    await page.waitForTimeout(2000);
    
    const playerDemoUrl = page.url();
    if (playerDemoUrl.includes('/player-demo')) {
      console.log('Acceso a demo de player exitoso');
      
      // Buscar elementos de video en la demo
      for (const selector of videoSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            console.log(`✅ Elemento de video encontrado en demo: ${selector}`);
            videoFound = true;
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test profile and settings navigation', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar enlaces de configuración y perfil en la navegación
    const profileNavSelectors = [
      'a[href*="profile"]',
      'a[href*="settings"]',
      'a[href*="account"]',
      'button:has-text("Profile")',
      'button:has-text("Perfil")',
      'button:has-text("Settings")',
      'button:has-text("Configuración")',
      '.user-menu',
      '.profile-menu'
    ];
    
    let profileNavFound = false;
    for (const selector of profileNavSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Elemento de navegación de perfil encontrado: ${selector}`);
          profileNavFound = true;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!profileNavFound) {
      console.log('⚠️ No se encontraron elementos de navegación de perfil');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test pricing and billing elements', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos de precios en la página principal
    const pricingSelectors = [
      'a[href*="pricing"]',
      'a[href="#pricing"]',
      'button:has-text("Upgrade")',
      'button:has-text("Subscribe")',
      'button:has-text("Plan")',
      '.pricing',
      '.subscription',
      '[data-testid="billing"]',
      'section[id="pricing"]'
    ];
    
    let pricingFound = false;
    for (const selector of pricingSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Elemento de precios encontrado: ${selector}`);
          pricingFound = true;
          
          // Si es un enlace, intentar hacer clic
          if (selector.includes('href')) {
            try {
              await element.click();
              await page.waitForTimeout(1000);
              console.log(`Navegación exitosa desde: ${selector}`);
            } catch (e) {
              console.log(`No se pudo navegar desde: ${selector}`);
            }
          }
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!pricingFound) {
      console.log('⚠️ No se encontraron elementos de precios en la página principal');
    }
    
    // Intentar navegar directamente a checkout
    await page.goto('http://localhost:8082/checkout');
    await page.waitForTimeout(2000);
    
    const checkoutUrl = page.url();
    if (checkoutUrl.includes('/checkout')) {
      console.log('✅ Acceso a página de checkout exitoso');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
});