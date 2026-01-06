import { test, expect } from './fixtures/auth';

test.describe('Enxoval (Layette) Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
  });

  test.describe('View Items', () => {
    test('should display enxoval table', async ({ authenticatedPage }) => {
      // Look for the enxoval table or item list
      const table = authenticatedPage.locator('table').or(
        authenticatedPage.locator('[data-testid="enxoval-list"]')
      );
      
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test('should show category filters', async ({ authenticatedPage }) => {
      // Check for category filter buttons or select
      const categoryFilter = authenticatedPage.locator('text=Roupas').or(
        authenticatedPage.locator('text=Higiene')
      ).or(authenticatedPage.locator('[data-testid="category-filter"]'));
      
      await expect(categoryFilter.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Add Item', () => {
    test('should open add item dialog', async ({ authenticatedPage }) => {
      // Find and click add button
      const addButton = authenticatedPage.locator('button:has-text("Adicionar")').or(
        authenticatedPage.locator('button:has-text("Novo Item")')
      ).or(authenticatedPage.locator('[data-testid="add-item-button"]'));
      
      await addButton.first().click();
      
      // Dialog should open
      const dialog = authenticatedPage.locator('[role="dialog"]').or(
        authenticatedPage.locator('[data-testid="item-dialog"]')
      );
      
      await expect(dialog).toBeVisible({ timeout: 5000 });
    });

    test('should create new item', async ({ authenticatedPage }) => {
      // Open add dialog
      const addButton = authenticatedPage.locator('button:has-text("Adicionar")').or(
        authenticatedPage.locator('button:has-text("Novo Item")')
      ).first();
      
      await addButton.click();
      
      // Fill form
      const itemNameInput = authenticatedPage.locator('input[name="item"]').or(
        authenticatedPage.locator('input[placeholder*="nome"]').or(
          authenticatedPage.locator('[data-testid="item-name-input"]')
        )
      );
      
      const uniqueName = `Test Item ${Date.now()}`;
      await itemNameInput.fill(uniqueName);
      
      // Select category if present
      const categorySelect = authenticatedPage.locator('select[name="category"]').or(
        authenticatedPage.locator('[data-testid="category-select"]')
      );
      
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 });
      }
      
      // Submit
      const submitButton = authenticatedPage.locator('button[type="submit"]').or(
        authenticatedPage.locator('button:has-text("Salvar")')
      );
      
      await submitButton.click();
      
      // Verify item appears in list
      await expect(authenticatedPage.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Edit Item', () => {
    test('should open edit dialog when clicking edit button', async ({ authenticatedPage }) => {
      // Find first edit button in table
      const editButton = authenticatedPage.locator('button[aria-label="Editar"]').or(
        authenticatedPage.locator('[data-testid="edit-item-button"]')
      ).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Dialog should open with form
        const dialog = authenticatedPage.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Delete Item', () => {
    test('should show confirmation when deleting item', async ({ authenticatedPage }) => {
      // Find delete button
      const deleteButton = authenticatedPage.locator('button[aria-label="Excluir"]').or(
        authenticatedPage.locator('[data-testid="delete-item-button"]')
      ).first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Should show confirmation dialog
        const confirmDialog = authenticatedPage.locator('text=Confirmar').or(
          authenticatedPage.locator('text=Tem certeza')
        ).or(authenticatedPage.locator('[role="alertdialog"]'));
        
        await expect(confirmDialog).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Export', () => {
    test('should have export button available', async ({ authenticatedPage }) => {
      const exportButton = authenticatedPage.locator('button:has-text("Exportar")').or(
        authenticatedPage.locator('[data-testid="export-button"]')
      );
      
      await expect(exportButton.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
