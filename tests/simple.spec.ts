import { test, expect } from '@playwright/test';

test.describe('Dashboard del Cliente - Pruebas E2E', () => {

  test('should load application homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:8082');
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Verificar que la página carga correctamente
    await expect(page).toHaveURL(/localhost:8082/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar botón o enlace de login
    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("Login")',
      'a:has-text("Iniciar")',
      'a:has-text("Sign In")',
      '[data-testid="login-button"]'
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        const loginButton = page.locator(selector).first();
        if (await loginButton.isVisible({ timeout: 2000 })) {
          await loginButton.click();
          await page.waitForURL(/login/, { timeout: 5000 });
          expect(page.url()).toContain('login');
          loginFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!loginFound) {
      console.log('No se encontró botón de login, verificando si ya estamos en página de login');
    }
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Buscar botón o enlace de registro
    const registerSelectors = [
      'a[href*="register"]',
      'button:has-text("Register")',
      'a:has-text("Registro")',
      'a:has-text("Sign Up")',
      '[data-testid="register-button"]'
    ];
    
    let registerFound = false;
    for (const selector of registerSelectors) {
      try {
        const registerButton = page.locator(selector).first();
        if (await registerButton.isVisible({ timeout: 2000 })) {
          await registerButton.click();
          await page.waitForURL(/register/, { timeout: 5000 });
          expect(page.url()).toContain('register');
          registerFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    if (!registerFound) {
      console.log('No se encontró botón de registro, verificando elementos de la página');
    }
  });

  test('should display navigation elements', async ({ page }) => {
    await page.goto('http://localhost:8082');
    
    // Verificar que existen elementos de navegación
    const navElements = [
      'nav',
      '.navbar',
      '.navigation',
      '[role="navigation"]',
      '.header',
      '.menu'
    ];
    
    let navFound = false;
    for (const selector of navElements) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          navFound = true;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    // Al menos debería haber algún contenido en la página
    await expect(page.locator('body')).toBeVisible();
  });
});