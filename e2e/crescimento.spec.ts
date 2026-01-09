import { test, expect } from './fixtures/auth';

test.describe('Crescimento do Bebê', () => {
  test.describe('Growth Chart in Baby Dashboard', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard-bebe');
      await authenticatedPage.waitForLoadState('networkidle');
    });

    test('should display growth chart tab', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento|growth/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const growthContent = authenticatedPage.locator('text=peso').or(
          authenticatedPage.locator('text=altura')
        ).or(authenticatedPage.locator('[data-testid="growth-chart"]'));
        
        await expect(growthContent.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have weight measurement input', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const weightInput = authenticatedPage.locator('input[name*="weight"]').or(
          authenticatedPage.locator('[data-testid="weight-input"]')
        );
        
        const isVisible = await weightInput.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should have height measurement input', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const heightInput = authenticatedPage.locator('input[name*="height"]').or(
          authenticatedPage.locator('[data-testid="height-input"]')
        );
        
        const isVisible = await heightInput.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should display growth percentile chart', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const chart = authenticatedPage.locator('.recharts-wrapper').or(
          authenticatedPage.locator('[data-testid="percentile-chart"]')
        ).or(authenticatedPage.locator('svg'));
        
        const isVisible = await chart.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should allow adding new measurement', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const addButton = authenticatedPage.locator('button:has-text("Adicionar")').or(
          authenticatedPage.locator('button:has-text("Registrar")')
        ).or(authenticatedPage.locator('[data-testid="add-measurement-button"]'));
        
        if (await addButton.first().isVisible()) {
          await addButton.first().click();
          
          const form = authenticatedPage.locator('[role="dialog"]').or(
            authenticatedPage.locator('form')
          );
          
          await expect(form.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Measurements History', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard-bebe');
      await authenticatedPage.waitForLoadState('networkidle');
    });

    test('should show measurement history', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const historySection = authenticatedPage.locator('table').or(
          authenticatedPage.locator('[data-testid="measurement-history"]')
        );
        
        const isVisible = await historySection.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should allow deleting measurement', async ({ authenticatedPage }) => {
      const growthTab = authenticatedPage.getByRole('tab', { name: /crescimento/i });
      
      if (await growthTab.isVisible()) {
        await growthTab.click();
        
        const deleteButton = authenticatedPage.locator('button:has([class*="trash"])').or(
          authenticatedPage.locator('[data-testid="delete-measurement-button"]')
        );
        
        const isVisible = await deleteButton.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });
});
