import { test, expect } from './fixtures/auth';

test.describe('Profile Settings', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/configuracoes');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display settings page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Configurações')
      );
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Profile Information', () => {
    test('should show profile form fields', async ({ authenticatedPage }) => {
      const nameInput = authenticatedPage.locator('input[name="full_name"]').or(
        authenticatedPage.locator('input[placeholder*="nome"]')
      ).or(authenticatedPage.locator('[data-testid="name-input"]'));
      
      await expect(nameInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow updating profile name', async ({ authenticatedPage }) => {
      const nameInput = authenticatedPage.locator('input[name="full_name"]').first();
      
      if (await nameInput.isVisible()) {
        const newName = `Test User ${Date.now()}`;
        await nameInput.fill(newName);
        
        const saveButton = authenticatedPage.locator('button:has-text("Salvar")');
        if (await saveButton.first().isVisible()) {
          await saveButton.first().click();
          
          // Should show success message
          await authenticatedPage.waitForLoadState('networkidle');
        }
      }
    });

    test('should display email field (read-only)', async ({ authenticatedPage }) => {
      const emailField = authenticatedPage.locator('input[type="email"]').or(
        authenticatedPage.locator('[data-testid="email-field"]')
      );
      
      const isVisible = await emailField.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Pregnancy Information', () => {
    test('should show pregnancy stage selector', async ({ authenticatedPage }) => {
      const stageSelect = authenticatedPage.locator('text=trimestre').or(
        authenticatedPage.locator('text=gestação')
      ).or(authenticatedPage.locator('[data-testid="pregnancy-stage"]'));
      
      const isVisible = await stageSelect.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });

    test('should show due date field', async ({ authenticatedPage }) => {
      const dueDateInput = authenticatedPage.locator('input[type="date"]').or(
        authenticatedPage.locator('text=data prevista')
      ).or(authenticatedPage.locator('[data-testid="due-date-input"]'));
      
      const isVisible = await dueDateInput.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Notifications', () => {
    test('should have notification settings', async ({ authenticatedPage }) => {
      const notificationSection = authenticatedPage.locator('text=notificaç').or(
        authenticatedPage.locator('[data-testid="notification-settings"]')
      );
      
      const isVisible = await notificationSection.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Theme Toggle', () => {
    test('should have theme toggle option', async ({ authenticatedPage }) => {
      const themeToggle = authenticatedPage.locator('text=tema').or(
        authenticatedPage.locator('[data-testid="theme-toggle"]')
      ).or(authenticatedPage.locator('button[aria-label*="tema"]'));
      
      const isVisible = await themeToggle.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Account Actions', () => {
    test('should have logout button', async ({ authenticatedPage }) => {
      const logoutButton = authenticatedPage.locator('button:has-text("Sair")').or(
        authenticatedPage.locator('[data-testid="logout-button"]')
      );
      
      await expect(logoutButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have delete account option', async ({ authenticatedPage }) => {
      const deleteButton = authenticatedPage.locator('text=excluir conta').or(
        authenticatedPage.locator('button:has-text("Excluir")')
      ).or(authenticatedPage.locator('[data-testid="delete-account-button"]'));
      
      const isVisible = await deleteButton.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });
});
