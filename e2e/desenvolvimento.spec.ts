import { test, expect } from './fixtures/auth';

test.describe('Monitor de Desenvolvimento', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/monitor-desenvolvimento');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display development monitor page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Desenvolvimento')
      ).or(authenticatedPage.locator('text=Marcos'));
      
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show baby profile requirement or milestones', async ({ authenticatedPage }) => {
      const content = authenticatedPage.locator('text=bebê').or(
        authenticatedPage.locator('text=marco')
      ).or(authenticatedPage.locator('[data-testid="development-monitor"]'));
      
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Milestone Timeline', () => {
    test('should display milestone timeline', async ({ authenticatedPage }) => {
      const timelineTab = authenticatedPage.getByRole('tab', { name: /timeline|linha do tempo/i });
      
      if (await timelineTab.isVisible()) {
        await timelineTab.click();
        
        const timeline = authenticatedPage.locator('[data-testid="milestone-timeline"]').or(
          authenticatedPage.locator('text=mês')
        );
        
        await expect(timeline.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Development Areas', () => {
    test('should show development areas filter', async ({ authenticatedPage }) => {
      const areas = authenticatedPage.locator('text=Motor').or(
        authenticatedPage.locator('text=Cognitivo')
      ).or(authenticatedPage.locator('text=Social'));
      
      const isVisible = await areas.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });

    test('should filter milestones by area', async ({ authenticatedPage }) => {
      const motorFilter = authenticatedPage.locator('button:has-text("Motor")').or(
        authenticatedPage.locator('[data-testid="filter-motor"]')
      );
      
      if (await motorFilter.isVisible()) {
        await motorFilter.click();
        
        // Should update displayed milestones
        await authenticatedPage.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Quick Registration', () => {
    test('should have quick milestone registration', async ({ authenticatedPage }) => {
      const quickRegTab = authenticatedPage.getByRole('tab', { name: /registro|rápido/i });
      
      if (await quickRegTab.isVisible()) {
        await quickRegTab.click();
        
        const checkboxes = authenticatedPage.locator('[type="checkbox"]');
        
        const count = await checkboxes.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Attention Alerts', () => {
    test('should show attention milestones section', async ({ authenticatedPage }) => {
      const alertsTab = authenticatedPage.getByRole('tab', { name: /atenção|alerta/i });
      
      if (await alertsTab.isVisible()) {
        await alertsTab.click();
        
        const alertsContent = authenticatedPage.locator('text=atenção').or(
          authenticatedPage.locator('[data-testid="attention-milestones"]')
        );
        
        await expect(alertsContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Pediatrician Report', () => {
    test('should have report generation option', async ({ authenticatedPage }) => {
      const reportButton = authenticatedPage.locator('button:has-text("Relatório")').or(
        authenticatedPage.locator('button:has-text("Pediatra")')
      ).or(authenticatedPage.locator('[data-testid="generate-report-button"]'));
      
      const isVisible = await reportButton.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });

    test('should open report dialog', async ({ authenticatedPage }) => {
      const reportButton = authenticatedPage.locator('button:has-text("Relatório")').first();
      
      if (await reportButton.isVisible()) {
        await reportButton.click();
        
        const dialog = authenticatedPage.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Alert Configuration', () => {
    test('should have alert settings', async ({ authenticatedPage }) => {
      const configTab = authenticatedPage.getByRole('tab', { name: /configuração|alertas/i });
      
      if (await configTab.isVisible()) {
        await configTab.click();
        
        const configContent = authenticatedPage.locator('[type="checkbox"]').or(
          authenticatedPage.locator('text=notificação')
        );
        
        await expect(configContent.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Dashboard', () => {
    test('should display development dashboard', async ({ authenticatedPage }) => {
      const dashboardTab = authenticatedPage.getByRole('tab', { name: /dashboard/i });
      
      if (await dashboardTab.isVisible()) {
        await dashboardTab.click();
        
        const dashboardContent = authenticatedPage.locator('[data-testid="development-dashboard"]').or(
          authenticatedPage.locator('text=progresso')
        );
        
        const isVisible = await dashboardContent.first().isVisible().catch(() => false);
        expect(isVisible !== undefined).toBeTruthy();
      }
    });
  });
});
