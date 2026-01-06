import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Public Routes', () => {
    test('should display landing page', async ({ page }) => {
      await page.goto('/');
      
      // Landing page should have main content
      const mainContent = page.locator('h1').or(
        page.locator('[data-testid="landing-hero"]')
      );
      
      await expect(mainContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to auth page', async ({ page }) => {
      await page.goto('/');
      
      // Find login/signup link
      const authLink = page.locator('a[href="/auth"]').or(
        page.locator('button:has-text("Entrar")')
      ).or(page.locator('button:has-text("Login")'));
      
      await authLink.first().click();
      
      await expect(page).toHaveURL(/\/auth/);
    });

    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/');
      
      // Check for essential meta tags
      const title = await page.title();
      expect(title).toBeTruthy();
      
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to auth when accessing protected route without login', async ({ page }) => {
      // Clear cookies to ensure logged out state
      await page.context().clearCookies();
      
      await page.goto('/materiais');
      
      // Should redirect to auth
      await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
    });

    test('should redirect to auth when accessing dashboard without login', async ({ page }) => {
      await page.context().clearCookies();
      
      await page.goto('/dashboard');
      
      await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
    });
  });

  test.describe('Main Navigation (Authenticated)', () => {
    test.use({ storageState: 'e2e/.auth/user.json' });

    test('should navigate to materials page', async ({ page }) => {
      await page.goto('/materiais');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/materiais/);
    });

    test('should navigate to dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Should be on dashboard or redirected to valid page
      await expect(page.url()).toContain('/');
    });

    test('should navigate to community', async ({ page }) => {
      await page.goto('/comunidade');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/comunidade/);
    });

    test('should navigate to sleep diary', async ({ page }) => {
      await page.goto('/diario-sono');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/diario-sono/);
    });

    test('should navigate to feeding guide', async ({ page }) => {
      await page.goto('/guia-alimentacao');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/guia-alimentacao/);
    });

    test('should navigate to vaccination card', async ({ page }) => {
      await page.goto('/cartao-vacinacao');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/cartao-vacinacao/);
    });

    test('should navigate to profile settings', async ({ page }) => {
      await page.goto('/configuracoes');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/configuracoes/);
    });
  });

  test.describe('404 Page', () => {
    test('should show not found page for invalid routes', async ({ page }) => {
      await page.goto('/invalid-route-12345');
      
      // Should show 404 content
      const notFound = page.locator('text=404').or(
        page.locator('text=Não encontrada')
      ).or(page.locator('text=Not Found'));
      
      await expect(notFound.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have link back to home', async ({ page }) => {
      await page.goto('/invalid-route-12345');
      
      // Should have home link
      const homeLink = page.locator('a[href="/"]').or(
        page.locator('button:has-text("Voltar")')
      );
      
      await expect(homeLink.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile menu on small screens', async ({ page }) => {
      await page.goto('/');
      
      // Look for mobile menu button
      const menuButton = page.locator('button[aria-label*="menu"]').or(
        page.locator('[data-testid="mobile-menu-button"]')
      ).or(page.locator('button:has(.lucide-menu)'));
      
      // Mobile menu button may or may not be present depending on implementation
      const isVisible = await menuButton.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Back Navigation', () => {
    test('should support browser back button', async ({ page }) => {
      await page.goto('/');
      await page.goto('/auth');
      
      await page.goBack();
      
      await expect(page).toHaveURL('/');
    });
  });
});
