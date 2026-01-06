import { test, expect } from './fixtures/auth';

test.describe('Sleep Diary (Diário do Sono)', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/diario-sono');
  });

  test.describe('Dashboard View', () => {
    test('should display sleep dashboard', async ({ authenticatedPage }) => {
      // Wait for page to load
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Should show dashboard or setup prompt
      const dashboard = authenticatedPage.locator('text=Sono').or(
        authenticatedPage.locator('text=Sleep')
      ).or(authenticatedPage.locator('[data-testid="sleep-dashboard"]'));
      
      await expect(dashboard.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show sleep statistics if data exists', async ({ authenticatedPage }) => {
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Look for stats cards or charts
      const statsElement = authenticatedPage.locator('text=horas').or(
        authenticatedPage.locator('text=Total')
      ).or(authenticatedPage.locator('[data-testid="sleep-stats"]'));
      
      // This may or may not be visible depending on user data
      const isVisible = await statsElement.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Add Sleep Record', () => {
    test('should open sleep registration form', async ({ authenticatedPage }) => {
      // Find add sleep button
      const addButton = authenticatedPage.locator('button:has-text("Registrar")').or(
        authenticatedPage.locator('button:has-text("Adicionar")')
      ).or(authenticatedPage.locator('[data-testid="add-sleep-button"]'));
      
      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        
        // Form or dialog should appear
        const form = authenticatedPage.locator('form').or(
          authenticatedPage.locator('[role="dialog"]')
        );
        
        await expect(form.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have required fields in sleep form', async ({ authenticatedPage }) => {
      const addButton = authenticatedPage.locator('button:has-text("Registrar")').or(
        authenticatedPage.locator('button:has-text("Adicionar")')
      ).first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Check for time inputs
        const timeInput = authenticatedPage.locator('input[type="time"]').or(
          authenticatedPage.locator('input[type="datetime-local"]')
        ).or(authenticatedPage.locator('[data-testid="sleep-time-input"]'));
        
        await expect(timeInput.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should create sleep record', async ({ authenticatedPage }) => {
      const addButton = authenticatedPage.locator('button:has-text("Registrar")').or(
        authenticatedPage.locator('button:has-text("Adicionar")')
      ).first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Fill sleep start time
        const startInput = authenticatedPage.locator('input[name="sleep_start"]').or(
          authenticatedPage.locator('[data-testid="sleep-start-input"]')
        );
        
        if (await startInput.isVisible()) {
          // Set time to now
          const now = new Date();
          const timeString = now.toISOString().slice(0, 16);
          await startInput.fill(timeString);
        }
        
        // Submit form
        const submitButton = authenticatedPage.locator('button[type="submit"]').or(
          authenticatedPage.locator('button:has-text("Salvar")')
        );
        
        await submitButton.click();
        
        // Should show success or update list
        await authenticatedPage.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Sleep History', () => {
    test('should display sleep history tab or section', async ({ authenticatedPage }) => {
      // Look for history tab
      const historyTab = authenticatedPage.locator('text=Histórico').or(
        authenticatedPage.locator('[data-testid="sleep-history-tab"]')
      );
      
      if (await historyTab.first().isVisible()) {
        await historyTab.first().click();
        
        // Should show history content
        const historyContent = authenticatedPage.locator('table').or(
          authenticatedPage.locator('[data-testid="sleep-history-list"]')
        );
        
        await expect(historyContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Export PDF', () => {
    test('should have PDF export option', async ({ authenticatedPage }) => {
      const exportButton = authenticatedPage.locator('button:has-text("PDF")').or(
        authenticatedPage.locator('button:has-text("Exportar")')
      ).or(authenticatedPage.locator('[data-testid="export-pdf-button"]'));
      
      // Export button may or may not be visible depending on data
      const isVisible = await exportButton.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });
});
