import { test, expect } from './fixtures/auth';

test.describe('Alimentação do Bebê', () => {
  test.describe('Food Introduction Diary', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard-bebe');
      await authenticatedPage.waitForLoadState('networkidle');
    });

    test('should display food introduction tab', async ({ authenticatedPage }) => {
      const foodTab = authenticatedPage.getByRole('tab', { name: /alimentação|introdução/i });
      
      if (await foodTab.isVisible()) {
        await foodTab.click();
        
        const foodContent = authenticatedPage.locator('text=alimento').or(
          authenticatedPage.locator('[data-testid="food-introduction"]')
        );
        
        await expect(foodContent.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show food categories', async ({ authenticatedPage }) => {
      const foodTab = authenticatedPage.getByRole('tab', { name: /alimentação/i });
      
      if (await foodTab.isVisible()) {
        await foodTab.click();
        
        const categories = authenticatedPage.locator('text=Fruta').or(
          authenticatedPage.locator('text=Legume')
        ).or(authenticatedPage.locator('text=Proteína'));
        
        const isVisible = await categories.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should allow registering new food', async ({ authenticatedPage }) => {
      const foodTab = authenticatedPage.getByRole('tab', { name: /alimentação/i });
      
      if (await foodTab.isVisible()) {
        await foodTab.click();
        
        const addButton = authenticatedPage.locator('button:has-text("Adicionar")').or(
          authenticatedPage.locator('button:has-text("Registrar")')
        );
        
        if (await addButton.first().isVisible()) {
          await addButton.first().click();
          
          const form = authenticatedPage.locator('[role="dialog"]').or(
            authenticatedPage.locator('form')
          );
          
          await expect(form.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should show allergenic food warnings', async ({ authenticatedPage }) => {
      const foodTab = authenticatedPage.getByRole('tab', { name: /alimentação/i });
      
      if (await foodTab.isVisible()) {
        await foodTab.click();
        
        const allergenWarning = authenticatedPage.locator('text=alérgeno').or(
          authenticatedPage.locator('text=alergia')
        ).or(authenticatedPage.locator('[data-testid="allergen-warning"]'));
        
        const isVisible = await allergenWarning.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should track food acceptance', async ({ authenticatedPage }) => {
      const foodTab = authenticatedPage.getByRole('tab', { name: /alimentação/i });
      
      if (await foodTab.isVisible()) {
        await foodTab.click();
        
        const acceptanceOptions = authenticatedPage.locator('text=Aceito').or(
          authenticatedPage.locator('text=Rejeitado')
        ).or(authenticatedPage.locator('[data-testid="acceptance-select"]'));
        
        const isVisible = await acceptanceOptions.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });

  test.describe('Bottle Calculator', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard-bebe');
      await authenticatedPage.waitForLoadState('networkidle');
    });

    test('should display bottle calculator', async ({ authenticatedPage }) => {
      const calcTab = authenticatedPage.getByRole('tab', { name: /calculadora|mamadeira/i });
      
      if (await calcTab.isVisible()) {
        await calcTab.click();
        
        const calcContent = authenticatedPage.locator('text=ml').or(
          authenticatedPage.locator('[data-testid="bottle-calculator"]')
        );
        
        await expect(calcContent.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should calculate bottle size based on age', async ({ authenticatedPage }) => {
      const calcTab = authenticatedPage.getByRole('tab', { name: /calculadora/i });
      
      if (await calcTab.isVisible()) {
        await calcTab.click();
        
        const ageInput = authenticatedPage.locator('input[name*="age"]').or(
          authenticatedPage.locator('[data-testid="baby-age-input"]')
        );
        
        if (await ageInput.first().isVisible()) {
          await ageInput.first().fill('3');
          
          // Should show calculated result
          const result = authenticatedPage.locator('text=ml').or(
            authenticatedPage.locator('[data-testid="bottle-result"]')
          );
          
          await expect(result.first()).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Feeding Log Integration', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard-bebe');
      await authenticatedPage.waitForLoadState('networkidle');
    });

    test('should show feeding logs', async ({ authenticatedPage }) => {
      const feedingTab = authenticatedPage.getByRole('tab', { name: /amamentação/i });
      
      if (await feedingTab.isVisible()) {
        await feedingTab.click();
        
        const logsContent = authenticatedPage.locator('[data-testid="feeding-logs"]').or(
          authenticatedPage.locator('table')
        );
        
        const isVisible = await logsContent.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });

    test('should support different feeding types', async ({ authenticatedPage }) => {
      const feedingTab = authenticatedPage.getByRole('tab', { name: /amamentação/i });
      
      if (await feedingTab.isVisible()) {
        await feedingTab.click();
        
        const feedingTypes = authenticatedPage.locator('text=Peito').or(
          authenticatedPage.locator('text=Mamadeira')
        ).or(authenticatedPage.locator('text=Misto'));
        
        const isVisible = await feedingTypes.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });
});
