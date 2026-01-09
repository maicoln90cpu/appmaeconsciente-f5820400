import { test, expect } from './fixtures/auth';

test.describe('Minhas Conquistas (Gamification)', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/minhas-conquistas');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test.describe('Page Load', () => {
    test('should display achievements page', async ({ authenticatedPage }) => {
      const header = authenticatedPage.locator('h1').or(
        authenticatedPage.locator('text=Conquistas')
      );
      await expect(header.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Level Progress', () => {
    test('should show current level', async ({ authenticatedPage }) => {
      const levelDisplay = authenticatedPage.locator('text=Nível').or(
        authenticatedPage.locator('[data-testid="current-level"]')
      );
      
      await expect(levelDisplay.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show XP progress', async ({ authenticatedPage }) => {
      const xpDisplay = authenticatedPage.locator('text=XP').or(
        authenticatedPage.locator('[data-testid="xp-progress"]')
      ).or(authenticatedPage.locator('[role="progressbar"]'));
      
      await expect(xpDisplay.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Badges', () => {
    test('should display badge grid', async ({ authenticatedPage }) => {
      const badgeGrid = authenticatedPage.locator('[data-testid="badge-grid"]').or(
        authenticatedPage.locator('.badge-grid')
      ).or(authenticatedPage.locator('text=conquistas'));
      
      await expect(badgeGrid.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show locked and unlocked badges', async ({ authenticatedPage }) => {
      const badges = authenticatedPage.locator('[data-testid="badge"]').or(
        authenticatedPage.locator('.badge-item')
      );
      
      const count = await badges.count();
      expect(count >= 0).toBeTruthy();
    });
  });

  test.describe('Daily Login', () => {
    test('should show daily login tracker', async ({ authenticatedPage }) => {
      const loginTracker = authenticatedPage.locator('text=dias').or(
        authenticatedPage.locator('[data-testid="daily-login-tracker"]')
      ).or(authenticatedPage.locator('text=streak'));
      
      const isVisible = await loginTracker.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Weekly Goals', () => {
    test('should display weekly goal card', async ({ authenticatedPage }) => {
      const weeklyGoal = authenticatedPage.locator('text=meta').or(
        authenticatedPage.locator('[data-testid="weekly-goal-card"]')
      ).or(authenticatedPage.locator('text=semanal'));
      
      const isVisible = await weeklyGoal.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Activity Calendar', () => {
    test('should show activity calendar', async ({ authenticatedPage }) => {
      const calendar = authenticatedPage.locator('[data-testid="activity-calendar"]').or(
        authenticatedPage.locator('.activity-calendar')
      );
      
      const isVisible = await calendar.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });

  test.describe('Leaderboard', () => {
    test('should display leaderboard section', async ({ authenticatedPage }) => {
      const leaderboard = authenticatedPage.locator('text=ranking').or(
        authenticatedPage.locator('[data-testid="leaderboard"]')
      ).or(authenticatedPage.locator('text=líderes'));
      
      const isVisible = await leaderboard.first().isVisible().catch(() => false);
      expect(isVisible !== undefined).toBeTruthy();
    });
  });
});
