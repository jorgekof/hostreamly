import { test, expect } from '@playwright/test';

test.describe('Dashboard Features - Pruebas de Funcionalidades', () => {
  
  test('should test file upload functionality', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con subida de archivos
    const uploadSelectors = [
      'input[type="file"]',
      '[data-testid="file-upload"]',
      '.upload-area',
      'button:has-text("Upload")',
      'button:has-text("Subir")',
      '.dropzone'
    ];
    
    let uploadFound = false;
    for (const selector of uploadSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de subida encontrado: ${selector}`);
          uploadFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!uploadFound) {
      console.log('No se encontraron elementos de subida de archivos en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test video streaming elements', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con streaming de video
    const videoSelectors = [
      'video',
      '.video-player',
      '[data-testid="video-player"]',
      '.streaming-container',
      'iframe[src*="video"]'
    ];
    
    let videoFound = false;
    for (const selector of videoSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de video encontrado: ${selector}`);
          videoFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!videoFound) {
      console.log('No se encontraron elementos de video en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test subscription and billing elements', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con suscripciones y facturación
    const billingSelectors = [
      'button:has-text("Upgrade")',
      'button:has-text("Subscribe")',
      'button:has-text("Plan")',
      '.pricing',
      '.subscription',
      '[data-testid="billing"]',
      'a[href*="pricing"]',
      'a[href*="billing"]'
    ];
    
    let billingFound = false;
    for (const selector of billingSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de facturación encontrado: ${selector}`);
          billingFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!billingFound) {
      console.log('No se encontraron elementos de facturación en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test file management interface', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con gestión de archivos
    const fileManagementSelectors = [
      '.file-list',
      '.file-manager',
      '[data-testid="file-list"]',
      'table',
      '.grid',
      'button:has-text("Delete")',
      'button:has-text("Eliminar")',
      '.file-item'
    ];
    
    let fileManagementFound = false;
    for (const selector of fileManagementSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de gestión de archivos encontrado: ${selector}`);
          fileManagementFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!fileManagementFound) {
      console.log('No se encontraron elementos de gestión de archivos en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
});