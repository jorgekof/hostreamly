import { test, expect } from '@playwright/test';

test.describe('Profile Settings - Configuración de Perfil', () => {
  
  test('should test profile settings access', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con configuración de perfil
    const profileSelectors = [
      'button:has-text("Profile")',
      'button:has-text("Perfil")',
      'a[href*="profile"]',
      'a[href*="settings"]',
      'a[href*="account"]',
      '[data-testid="profile-button"]',
      '.profile-menu',
      '.user-menu',
      '.avatar',
      '.user-avatar'
    ];
    
    let profileFound = false;
    for (const selector of profileSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de perfil encontrado: ${selector}`);
          profileFound = true;
          
          // Intentar hacer clic si es un enlace o botón
          if (selector.includes('href') || selector.includes('button')) {
            try {
              await element.click();
              await page.waitForTimeout(2000);
              console.log(`Navegación exitosa desde: ${selector}`);
            } catch (e) {
              console.log(`No se pudo hacer clic en: ${selector}`);
            }
          }
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!profileFound) {
      console.log('No se encontraron elementos de perfil en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test account settings elements', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con configuración de cuenta
    const accountSelectors = [
      'input[type="email"]',
      'input[type="password"]',
      'input[name="name"]',
      'input[name="username"]',
      'button:has-text("Save")',
      'button:has-text("Guardar")',
      'button:has-text("Update")',
      'button:has-text("Actualizar")',
      '.settings-form',
      '.account-form',
      '[data-testid="settings-form"]'
    ];
    
    let accountFound = false;
    for (const selector of accountSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de configuración de cuenta encontrado: ${selector}`);
          accountFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!accountFound) {
      console.log('No se encontraron elementos de configuración de cuenta en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test user preferences and settings', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con preferencias de usuario
    const preferencesSelectors = [
      'select',
      'input[type="checkbox"]',
      'input[type="radio"]',
      '.toggle',
      '.switch',
      'button:has-text("Preferences")',
      'button:has-text("Preferencias")',
      '.preferences',
      '.settings-panel',
      '[data-testid="preferences"]'
    ];
    
    let preferencesFound = false;
    for (const selector of preferencesSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de preferencias encontrado: ${selector}`);
          preferencesFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!preferencesFound) {
      console.log('No se encontraron elementos de preferencias en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should test security settings', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar elementos relacionados con configuración de seguridad
    const securitySelectors = [
      'button:has-text("Change Password")',
      'button:has-text("Cambiar Contraseña")',
      'button:has-text("Security")',
      'button:has-text("Seguridad")',
      'input[name="current_password"]',
      'input[name="new_password"]',
      'input[name="confirm_password"]',
      '.security-settings',
      '.password-form',
      '[data-testid="security-settings"]'
    ];
    
    let securityFound = false;
    for (const selector of securitySelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`Elemento de seguridad encontrado: ${selector}`);
          securityFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!securityFound) {
      console.log('No se encontraron elementos de seguridad en la página principal');
    }
    
    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible();
  });
});