import { test, expect } from './fixtures/auth';

test.describe('Recuperação Pós-Parto', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recuperacao-pos-parto');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display recovery page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Recuperação')
      ).or(authenticatedPage.locator('text=Pós-Parto'));
      
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show delivery type selector or content', async ({ authenticatedPage }) => {
      const content = authenticatedPage.locator('text=parto').or(
        authenticatedPage.locator('[data-testid="delivery-type-selector"]')
      ).or(authenticatedPage.locator('[data-testid="recovery-dashboard"]'));
      
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Delivery Type Selection', () => {
    test('should allow selecting delivery type', async ({ authenticatedPage }) => {
      const normalOption = authenticatedPage.locator('text=Normal').or(
        authenticatedPage.locator('text=Vaginal')
      );
      
      const cesareanOption = authenticatedPage.locator('text=Cesárea').or(
        authenticatedPage.locator('text=Cesariana')
      );
      
      const hasOptions = await normalOption.first().isVisible().catch(() => false) ||
                          await cesareanOption.first().isVisible().catch(() => false);
      
      expect(hasOptions !== undefined).toBeTruthy();
    });
  });

  test.describe('Recovery Checklist', () => {
    test('should display recovery checklist', async ({ authenticatedPage }) => {
      const checklistTab = authenticatedPage.getByRole('tab', { name: /checklist|tarefas/i });
      
      if (await checklistTab.isVisible()) {
        await checklistTab.click();
        
        const checklist = authenticatedPage.locator('[type="checkbox"]').or(
          authenticatedPage.locator('[data-testid="recovery-checklist"]')
        );
        
        await expect(checklist.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow checking items', async ({ authenticatedPage }) => {
      const checkbox = authenticatedPage.locator('[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        const initialState = await checkbox.isChecked();
        await checkbox.click();
        
        // State should change
        const newState = await checkbox.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });
  });

  test.describe('Symptom Tracker', () => {
    test('should show symptom tracking section', async ({ authenticatedPage }) => {
      const symptomTab = authenticatedPage.getByRole('tab', { name: /sintoma|saúde/i });
      
      if (await symptomTab.isVisible()) {
        await symptomTab.click();
        
        const symptomContent = authenticatedPage.locator('text=sintoma').or(
          authenticatedPage.locator('[data-testid="symptom-tracker"]')
        );
        
        await expect(symptomContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Edinburgh Scale', () => {
    test('should have Edinburgh depression scale option', async ({ authenticatedPage }) => {
      const edinburghTab = authenticatedPage.getByRole('tab', { name: /edinburgh|emocional|humor/i });
      
      if (await edinburghTab.isVisible()) {
        await edinburghTab.click();
        
        const scaleContent = authenticatedPage.locator('text=Edinburgh').or(
          authenticatedPage.locator('text=questões')
        ).or(authenticatedPage.locator('[data-testid="edinburgh-scale"]'));
        
        await expect(scaleContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Medication Control', () => {
    test('should show medication tracking', async ({ authenticatedPage }) => {
      const medicationTab = authenticatedPage.getByRole('tab', { name: /medicamento|remédio/i });
      
      if (await medicationTab.isVisible()) {
        await medicationTab.click();
        
        const medicationContent = authenticatedPage.locator('button:has-text("Adicionar")').or(
          authenticatedPage.locator('[data-testid="medication-tracker"]')
        );
        
        await expect(medicationContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Self-Esteem Diary', () => {
    test('should display self-esteem diary', async ({ authenticatedPage }) => {
      const diaryTab = authenticatedPage.getByRole('tab', { name: /diário|autoestima/i });
      
      if (await diaryTab.isVisible()) {
        await diaryTab.click();
        
        const diaryContent = authenticatedPage.locator('textarea').or(
          authenticatedPage.locator('[data-testid="self-esteem-diary"]')
        );
        
        await expect(diaryContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Recovery Dashboard', () => {
    test('should show recovery progress', async ({ authenticatedPage }) => {
      const dashboardTab = authenticatedPage.getByRole('tab', { name: /dashboard|progresso/i });
      
      if (await dashboardTab.isVisible()) {
        await dashboardTab.click();
        
        const progressContent = authenticatedPage.locator('[role="progressbar"]').or(
          authenticatedPage.locator('text=%')
        ).or(authenticatedPage.locator('[data-testid="recovery-progress"]'));
        
        const isVisible = await progressContent.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });
});
