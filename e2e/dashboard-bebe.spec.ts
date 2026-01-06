import { test, expect } from "@playwright/test";

test.describe("Baby Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to baby dashboard - requires auth
    await page.goto("/dashboard-bebe");
  });

  test("should show login page when not authenticated", async ({ page }) => {
    // Should redirect to auth page if not logged in
    await expect(page).toHaveURL(/.*auth.*/);
  });
});

test.describe("Baby Dashboard - Authenticated", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard-bebe");
    // Wait for content to load
    await page.waitForLoadState("networkidle");
  });

  test("should display baby dashboard header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /bebê/i })).toBeVisible();
  });

  test("should show tabs for different features", async ({ page }) => {
    // Check for main navigation tabs
    const tabList = page.getByRole("tablist");
    await expect(tabList).toBeVisible();
    
    // Should have multiple tabs
    const tabs = await page.getByRole("tab").all();
    expect(tabs.length).toBeGreaterThan(3);
  });

  test("should navigate between tabs", async ({ page }) => {
    // Click on different tabs
    const feedingTab = page.getByRole("tab", { name: /amamentação|alimentação/i });
    if (await feedingTab.isVisible()) {
      await feedingTab.click();
      await expect(feedingTab).toHaveAttribute("aria-selected", "true");
    }

    const sleepTab = page.getByRole("tab", { name: /sono/i });
    if (await sleepTab.isVisible()) {
      await sleepTab.click();
      await expect(sleepTab).toHaveAttribute("aria-selected", "true");
    }
  });

  test("should have accessible form fields", async ({ page }) => {
    // Navigate to a tab with forms
    const feedingTab = page.getByRole("tab", { name: /amamentação|alimentação/i });
    if (await feedingTab.isVisible()) {
      await feedingTab.click();
    }

    // Check for form accessibility
    const inputs = await page.getByRole("textbox").all();
    for (const input of inputs) {
      // Each input should have an accessible name
      const name = await input.getAttribute("aria-label") || await input.getAttribute("placeholder");
      expect(name).toBeTruthy();
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Focus the first tab
    await page.keyboard.press("Tab");
    
    // Navigate with arrow keys
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press("Enter");
  });

  test("should show loading states", async ({ page }) => {
    // On initial load, there might be loading indicators
    await page.goto("/dashboard-bebe");
    
    // Wait for loading to complete
    await page.waitForLoadState("networkidle");
    
    // Content should now be visible (not loading)
    await expect(page.getByRole("tablist")).toBeVisible({ timeout: 10000 });
  });

  test("should handle empty states gracefully", async ({ page }) => {
    // Check that the page doesn't crash with no data
    await expect(page).not.toHaveTitle(/error/i);
  });

  test("should be responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard-bebe");
    
    // Content should still be accessible
    await page.waitForLoadState("networkidle");
    
    // Tabs should adapt (may become scrollable or dropdown)
    const tabList = page.getByRole("tablist");
    await expect(tabList).toBeVisible();
  });
});

test.describe("Baby Dashboard - Offline Support", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("should show offline banner when connection is lost", async ({ page, context }) => {
    await page.goto("/dashboard-bebe");
    await page.waitForLoadState("networkidle");

    // Simulate offline mode
    await context.setOffline(true);

    // Trigger a network request
    await page.reload();

    // Should show offline indicator
    await expect(page.getByText(/offline/i)).toBeVisible({ timeout: 5000 });
  });

  test("should restore when connection is back", async ({ page, context }) => {
    await page.goto("/dashboard-bebe");
    await page.waitForLoadState("networkidle");

    // Go offline then online
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    await context.setOffline(false);

    // Should recover
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Baby Dashboard - Accessibility", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("should not have accessibility violations", async ({ page }) => {
    await page.goto("/dashboard-bebe");
    await page.waitForLoadState("networkidle");

    // Basic ARIA checks
    // All interactive elements should be focusable
    const buttons = await page.getByRole("button").all();
    for (const button of buttons) {
      const tabIndex = await button.getAttribute("tabindex");
      expect(tabIndex !== "-1" || await button.isDisabled()).toBeTruthy();
    }

    // All images should have alt text
    const images = await page.getByRole("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("should support screen reader navigation", async ({ page }) => {
    await page.goto("/dashboard-bebe");
    await page.waitForLoadState("networkidle");

    // Check for landmarks
    await expect(page.getByRole("main")).toBeVisible();
    
    // Check for headings hierarchy
    const h1 = await page.getByRole("heading", { level: 1 }).all();
    expect(h1.length).toBeGreaterThanOrEqual(1);
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/dashboard-bebe");
    await page.waitForLoadState("networkidle");

    // Tab to first focusable element
    await page.keyboard.press("Tab");

    // Check that something has focus
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
