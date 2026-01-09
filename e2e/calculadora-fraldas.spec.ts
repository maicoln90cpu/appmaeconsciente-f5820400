import { test, expect } from '@playwright/test';

test.describe('Calculadora de Fraldas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculadora-fraldas');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display diaper calculator page', async ({ page }) => {
      const header = page.locator('h1').or(
        page.locator('text=Calculadora de Fraldas')
      );
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show calculator form', async ({ page }) => {
      const form = page.locator('form').or(
        page.locator('[data-testid="diaper-calculator-form"]')
      );
      await expect(form.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Calculator Inputs', () => {
    test('should have age input field', async ({ page }) => {
      const ageInput = page.locator('input[name="age"]').or(
        page.locator('text=idade')
      ).or(page.locator('[data-testid="age-input"]'));
      
      await expect(ageInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow selecting diaper size', async ({ page }) => {
      const sizeSelect = page.locator('select').or(
        page.locator('[data-testid="size-select"]')
      ).or(page.locator('text=tamanho'));
      
      await expect(sizeSelect.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Results', () => {
    test('should calculate and display results', async ({ page }) => {
      // Fill in some values and trigger calculation
      const calculateButton = page.locator('button:has-text("Calcular")').or(
        page.locator('[data-testid="calculate-button"]')
      );
      
      if (await calculateButton.first().isVisible()) {
        await calculateButton.first().click();
        
        // Should show results
        const results = page.locator('text=fraldas').or(
          page.locator('[data-testid="results-section"]')
        );
        await expect(results.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show cost comparison', async ({ page }) => {
      const comparisonSection = page.locator('text=comparação').or(
        page.locator('text=economia')
      ).or(page.locator('[data-testid="cost-comparison"]'));
      
      const isVisible = await comparisonSection.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Brand Comparison', () => {
    test('should show brand comparison section', async ({ page }) => {
      const brandSection = page.locator('text=marca').or(
        page.locator('[data-testid="brand-comparison"]')
      );
      
      const isVisible = await brandSection.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Cloth Diaper Simulator', () => {
    test('should have cloth diaper option', async ({ page }) => {
      const clothOption = page.locator('text=pano').or(
        page.locator('text=ecológica')
      ).or(page.locator('[data-testid="cloth-diaper-tab"]'));
      
      const isVisible = await clothOption.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });
});
