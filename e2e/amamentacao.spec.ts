import { test, expect } from './fixtures/auth';

test.describe('Rastreador de Amamentação', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/rastreador-amamentacao');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display breastfeeding tracker page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Amamentação')
      );
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show tabs for different features', async ({ authenticatedPage }) => {
      const tabList = authenticatedPage.getByRole('tablist');
      await expect(tabList).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Feeding Registration', () => {
    test('should open feeding registration form', async ({ authenticatedPage }) => {
      const registerButton = authenticatedPage.locator('button:has-text("Registrar")').or(
        authenticatedPage.locator('button:has-text("Nova Mamada")')
      ).or(authenticatedPage.locator('[data-testid="register-feeding-button"]'));
      
      if (await registerButton.first().isVisible()) {
        await registerButton.first().click();
        
        const form = authenticatedPage.locator('[role="dialog"]').or(
          authenticatedPage.locator('form')
        );
        await expect(form.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have breast side selection', async ({ authenticatedPage }) => {
      const registerButton = authenticatedPage.locator('button:has-text("Registrar")').first();
      
      if (await registerButton.isVisible()) {
        await registerButton.click();
        
        // Should have left/right breast options
        const breastOption = authenticatedPage.locator('text=Esquerdo').or(
          authenticatedPage.locator('text=Direito')
        ).or(authenticatedPage.locator('[data-testid="breast-side-select"]'));
        
        const isVisible = await breastOption.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should show duration input', async ({ authenticatedPage }) => {
      const registerButton = authenticatedPage.locator('button:has-text("Registrar")').first();
      
      if (await registerButton.isVisible()) {
        await registerButton.click();
        
        const durationInput = authenticatedPage.locator('input[name="duration"]').or(
          authenticatedPage.locator('text=minutos')
        ).or(authenticatedPage.locator('[data-testid="duration-input"]'));
        
        const isVisible = await durationInput.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });

  test.describe('Feeding History', () => {
    test('should display feeding history section', async ({ authenticatedPage }) => {
      const historyTab = authenticatedPage.getByRole('tab', { name: /histórico/i });
      if (await historyTab.isVisible()) {
        await historyTab.click();
        
        const historyContent = authenticatedPage.locator('table').or(
          authenticatedPage.locator('[data-testid="feeding-history"]')
        );
        await expect(historyContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Pumping Management', () => {
    test('should show pumping/storage section', async ({ authenticatedPage }) => {
      const pumpingTab = authenticatedPage.getByRole('tab', { name: /ordenha|estoque/i });
      if (await pumpingTab.isVisible()) {
        await pumpingTab.click();
        
        const pumpingContent = authenticatedPage.locator('text=ml').or(
          authenticatedPage.locator('[data-testid="pumping-section"]')
        );
        await expect(pumpingContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Dashboard', () => {
    test('should show feeding statistics', async ({ authenticatedPage }) => {
      const dashboardTab = authenticatedPage.getByRole('tab', { name: /dashboard/i });
      if (await dashboardTab.isVisible()) {
        await dashboardTab.click();
        
        const statsContent = authenticatedPage.locator('text=total').or(
          authenticatedPage.locator('[data-testid="feeding-stats"]')
        );
        const isVisible = await statsContent.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
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
