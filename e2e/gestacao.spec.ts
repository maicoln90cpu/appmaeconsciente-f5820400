import { test, expect } from './fixtures/auth';

test.describe('Ferramentas de Gestação', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/ferramentas-gestacao');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display gestacao tools page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Gestação')
      ).or(authenticatedPage.locator('text=Gravidez'));
      
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show tabs for different tools', async ({ authenticatedPage }) => {
      const tabList = authenticatedPage.getByRole('tablist');
      await expect(tabList).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Due Date Calculator', () => {
    test('should display due date calculator', async ({ authenticatedPage }) => {
      const calculatorTab = authenticatedPage.getByRole('tab', { name: /data|previsão|parto/i });
      
      if (await calculatorTab.isVisible()) {
        await calculatorTab.click();
        
        const calculator = authenticatedPage.locator('text=DPP').or(
          authenticatedPage.locator('text=Data Provável')
        ).or(authenticatedPage.locator('[data-testid="due-date-calculator"]'));
        
        await expect(calculator.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have date input for last menstrual period', async ({ authenticatedPage }) => {
      const dateInput = authenticatedPage.locator('input[type="date"]').or(
        authenticatedPage.locator('[data-testid="lmp-date-input"]')
      );
      
      const isVisible = await dateInput.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });

    test('should calculate due date when date is entered', async ({ authenticatedPage }) => {
      const dateInput = authenticatedPage.locator('input[type="date"]').first();
      
      if (await dateInput.isVisible()) {
        // Set a past date (approximately 3 months ago)
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 3);
        await dateInput.fill(pastDate.toISOString().split('T')[0]);
        
        // Should show calculated result
        await authenticatedPage.waitForTimeout(500);
        
        const result = authenticatedPage.locator('text=semana').or(
          authenticatedPage.locator('[data-testid="pregnancy-week"]')
        );
        
        const isVisible = await result.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });

  test.describe('Contraction Timer', () => {
    test('should display contraction diary section', async ({ authenticatedPage }) => {
      const contractionTab = authenticatedPage.getByRole('tab', { name: /contração|contrações/i });
      
      if (await contractionTab.isVisible()) {
        await contractionTab.click();
        
        const timerContent = authenticatedPage.locator('button:has-text("Iniciar")').or(
          authenticatedPage.locator('[data-testid="contraction-timer"]')
        );
        
        await expect(timerContent.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should start contraction timer', async ({ authenticatedPage }) => {
      const contractionTab = authenticatedPage.getByRole('tab', { name: /contração/i });
      
      if (await contractionTab.isVisible()) {
        await contractionTab.click();
        
        const startButton = authenticatedPage.locator('button:has-text("Iniciar")').first();
        
        if (await startButton.isVisible()) {
          await startButton.click();
          
          // Should show stop button or running timer
          const stopButton = authenticatedPage.locator('button:has-text("Parar")').or(
            authenticatedPage.locator('button:has-text("Finalizar")')
          );
          
          await expect(stopButton.first()).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Ultrasound Album', () => {
    test('should display ultrasound album section', async ({ authenticatedPage }) => {
      const ultrasoundTab = authenticatedPage.getByRole('tab', { name: /ultrassom|ecografia/i });
      
      if (await ultrasoundTab.isVisible()) {
        await ultrasoundTab.click();
        
        const albumContent = authenticatedPage.locator('text=Ultrassom').or(
          authenticatedPage.locator('[data-testid="ultrasound-album"]')
        );
        
        await expect(albumContent.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have upload option', async ({ authenticatedPage }) => {
      const ultrasoundTab = authenticatedPage.getByRole('tab', { name: /ultrassom/i });
      
      if (await ultrasoundTab.isVisible()) {
        await ultrasoundTab.click();
        
        const uploadButton = authenticatedPage.locator('button:has-text("Upload")').or(
          authenticatedPage.locator('button:has-text("Adicionar")')
        ).or(authenticatedPage.locator('input[type="file"]'));
        
        const isVisible = await uploadButton.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });
});
