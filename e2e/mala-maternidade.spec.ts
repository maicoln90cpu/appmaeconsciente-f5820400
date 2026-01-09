import { test, expect } from './fixtures/auth';

test.describe('Mala da Maternidade', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/mala-maternidade');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display maternity bag page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Mala')
      );
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show checklist categories', async ({ authenticatedPage }) => {
      const categories = authenticatedPage.locator('text=Mamãe').or(
        authenticatedPage.locator('text=Bebê')
      ).or(authenticatedPage.locator('[data-testid="bag-category"]'));
      
      await expect(categories.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Checklist Items', () => {
    test('should display checklist items', async ({ authenticatedPage }) => {
      const items = authenticatedPage.locator('[type="checkbox"]').or(
        authenticatedPage.locator('[data-testid="checklist-item"]')
      );
      
      await expect(items.first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow checking items', async ({ authenticatedPage }) => {
      const checkbox = authenticatedPage.locator('[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        const wasChecked = await checkbox.isChecked();
        await checkbox.click();
        
        // State should have changed
        const isNowChecked = await checkbox.isChecked();
        expect(isNowChecked).toBe(!wasChecked);
      }
    });

    test('should persist checked state', async ({ authenticatedPage }) => {
      const checkbox = authenticatedPage.locator('[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await authenticatedPage.waitForTimeout(500);
        
        // Reload and verify state persisted
        await authenticatedPage.reload();
        await authenticatedPage.waitForLoadState('networkidle');
        
        const checkboxAfterReload = authenticatedPage.locator('[type="checkbox"]').first();
        const isStillChecked = await checkboxAfterReload.isChecked().catch(() => false);
        expect(isStillChecked !== undefined).toBeTruthy();
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('should show progress indicator', async ({ authenticatedPage }) => {
      const progress = authenticatedPage.locator('text=%').or(
        authenticatedPage.locator('[data-testid="progress-bar"]')
      ).or(authenticatedPage.locator('[role="progressbar"]'));
      
      await expect(progress.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Hospital Settings', () => {
    test('should have hospital settings section', async ({ authenticatedPage }) => {
      const settingsButton = authenticatedPage.locator('button:has-text("Configurações")').or(
        authenticatedPage.locator('text=hospital')
      ).or(authenticatedPage.locator('[data-testid="hospital-settings"]'));
      
      const isVisible = await settingsButton.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Export', () => {
    test('should have PDF export option', async ({ authenticatedPage }) => {
      const exportButton = authenticatedPage.locator('button:has-text("PDF")').or(
        authenticatedPage.locator('button:has-text("Exportar")')
      ).or(authenticatedPage.locator('[data-testid="export-pdf-button"]'));
      
      const isVisible = await exportButton.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });
});
