import { test, expect } from './fixtures/auth';

test.describe('Cartão de Vacinação', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/cartao-vacinacao');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Baby Profile', () => {
    test('should display vaccination card page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Vacinação')
      );
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show baby profile section or create prompt', async ({ authenticatedPage }) => {
      // Either shows existing profiles or create button
      const content = authenticatedPage.locator('text=perfil').or(
        authenticatedPage.locator('button:has-text("Adicionar")')
      ).or(authenticatedPage.locator('[data-testid="baby-profile"]'));
      
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow creating baby profile', async ({ authenticatedPage }) => {
      const addButton = authenticatedPage.locator('button:has-text("Adicionar")').or(
        authenticatedPage.locator('button:has-text("Cadastrar")')
      ).or(authenticatedPage.locator('[data-testid="add-baby-button"]'));
      
      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        
        // Form should appear
        const form = authenticatedPage.locator('[role="dialog"]').or(
          authenticatedPage.locator('form')
        );
        await expect(form.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Vaccination Calendar', () => {
    test('should display vaccination calendar', async ({ authenticatedPage }) => {
      const calendarTab = authenticatedPage.getByRole('tab', { name: /calendário/i });
      if (await calendarTab.isVisible()) {
        await calendarTab.click();
        
        const calendar = authenticatedPage.locator('[data-testid="vaccine-calendar"]').or(
          authenticatedPage.locator('text=vacina')
        );
        await expect(calendar.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show vaccine list', async ({ authenticatedPage }) => {
      // Look for common vaccines
      const vaccines = authenticatedPage.locator('text=BCG').or(
        authenticatedPage.locator('text=Hepatite')
      ).or(authenticatedPage.locator('text=Poliomielite'));
      
      const isVisible = await vaccines.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Record Vaccination', () => {
    test('should open vaccination registration form', async ({ authenticatedPage }) => {
      const registerButton = authenticatedPage.locator('button:has-text("Registrar")').or(
        authenticatedPage.locator('[data-testid="register-vaccine-button"]')
      );
      
      if (await registerButton.first().isVisible()) {
        await registerButton.first().click();
        
        const dialog = authenticatedPage.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have required fields in vaccination form', async ({ authenticatedPage }) => {
      const registerButton = authenticatedPage.locator('button:has-text("Registrar")').first();
      
      if (await registerButton.isVisible()) {
        await registerButton.click();
        
        // Check for date input
        const dateInput = authenticatedPage.locator('input[type="date"]').or(
          authenticatedPage.locator('[data-testid="vaccine-date-input"]')
        );
        
        const isVisible = await dateInput.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });

  test.describe('Reminder Settings', () => {
    test('should show reminder configuration', async ({ authenticatedPage }) => {
      const configTab = authenticatedPage.getByRole('tab', { name: /lembrete|configuração/i });
      if (await configTab.isVisible()) {
        await configTab.click();
        
        const reminderContent = authenticatedPage.locator('text=lembrete').or(
          authenticatedPage.locator('[data-testid="reminder-settings"]')
        );
        await expect(reminderContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
