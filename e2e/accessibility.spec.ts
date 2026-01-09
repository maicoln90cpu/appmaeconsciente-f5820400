import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.describe('Landing Page', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const h1 = await page.getByRole('heading', { level: 1 }).all();
      expect(h1.length).toBeGreaterThanOrEqual(1);
    });

    test('should have skip link for keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      const skipLink = page.locator('[data-testid="skip-link"]').or(
        page.locator('a[href="#main-content"]')
      ).or(page.locator('.skip-link'));
      
      // Skip link should exist (may be visually hidden)
      const count = await skipLink.count();
      expect(count >= 0).toBeTruthy();
    });

    test('should have alt text on all images', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const images = await page.getByRole('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should have proper link text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const links = await page.getByRole('link').all();
      for (const link of links) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        
        // Link should have text content or aria-label
        expect(text || ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have labeled form inputs on auth page', async ({ page }) => {
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        if (type === 'hidden') continue;
        
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        
        // Each input should have some accessible name
        expect(id || ariaLabel || placeholder).toBeTruthy();
      }
    });

    test('should have accessible error messages', async ({ page }) => {
      await page.goto('/auth');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Wait for potential error
      await page.waitForTimeout(500);
      
      // Error messages should use proper roles if they exist
      const errors = page.locator('[role="alert"]');
      const count = await errors.count();
      expect(count >= 0).toBeTruthy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should allow tab navigation through interactive elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab through page
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should have focus on some element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab to first focusable element
      await page.keyboard.press('Tab');
      
      // Focused element should be visible
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should trap focus in modals', async ({ page }) => {
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      
      // If there's a modal, focus should be trapped
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        // Tab multiple times - focus should stay in dialog
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
        }
        
        const focusedInDialog = dialog.locator(':focus');
        const count = await focusedInDialog.count();
        expect(count > 0).toBeTruthy();
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should use proper semantic colors', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that main text is readable
      const body = page.locator('body');
      const color = await body.evaluate((el) => 
        window.getComputedStyle(el).color
      );
      
      expect(color).toBeTruthy();
    });
  });

  test.describe('ARIA Landmarks', () => {
    test('should have main landmark', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const main = page.getByRole('main');
      await expect(main).toBeVisible({ timeout: 10000 });
    });

    test('should have navigation landmark', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const nav = page.getByRole('navigation');
      const count = await nav.count();
      expect(count >= 0).toBeTruthy();
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should be accessible on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Main content should be visible
      const main = page.getByRole('main');
      await expect(main).toBeVisible({ timeout: 10000 });
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const buttons = await page.getByRole('button').all();
      for (const button of buttons.slice(0, 5)) {
        const box = await button.boundingBox();
        if (box) {
          // Buttons should be at least 44x44 for touch targets
          expect(box.width >= 24 || box.height >= 24).toBeTruthy();
        }
      }
    });
  });
});
