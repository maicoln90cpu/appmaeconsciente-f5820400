import { test as base, Page, BrowserContext } from '@playwright/test';
import path from 'path';

// Test user credentials - should be configured via environment variables
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

// Storage state path for authenticated sessions
const STORAGE_STATE_PATH = path.join(__dirname, '../.auth/user.json');

export interface AuthFixtures {
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth');
  
  // Wait for auth form to load
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete (redirect after login)
  await page.waitForURL(/\/(materiais|dashboard)/, { timeout: 15000 });
}

/**
 * Signup helper function
 */
export async function signup(
  page: Page, 
  name: string,
  email: string, 
  password: string
): Promise<void> {
  await page.goto('/auth');
  
  // Wait for auth form and switch to signup mode
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Look for signup tab/button and click it
  const signupTab = page.locator('text=Criar conta').or(page.locator('text=Sign up'));
  if (await signupTab.isVisible()) {
    await signupTab.click();
  }
  
  // Fill signup form
  const nameInput = page.locator('input[name="full_name"]').or(page.locator('input[placeholder*="nome"]'));
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);
  }
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click signup button
  await page.click('button[type="submit"]');
  
  // Wait for success or navigation
  await page.waitForURL(/\/(materiais|dashboard|complete-profile)/, { timeout: 15000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  // Look for user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Sair")'));
  
  if (await userMenu.isVisible()) {
    await userMenu.click();
    
    const logoutButton = page.locator('text=Sair').or(page.locator('text=Logout'));
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
  
  // Wait for redirect to landing or auth page
  await page.waitForURL(/\/(auth|$)/, { timeout: 10000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for authenticated elements
    const authIndicator = page.locator('[data-testid="user-menu"]')
      .or(page.locator('button:has-text("Sair")'))
      .or(page.locator('a[href="/materiais"]'));
    
    return await authIndicator.isVisible({ timeout: 3000 });
  } catch {
    return false;
  }
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  authenticatedContext: async ({ browser }, use) => {
    // Create context with stored authentication state if available
    let context: BrowserContext;
    
    try {
      context = await browser.newContext({
        storageState: STORAGE_STATE_PATH,
      });
    } catch {
      // If no stored state, create fresh context
      context = await browser.newContext();
      const page = await context.newPage();
      await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
      await context.storageState({ path: STORAGE_STATE_PATH });
    }
    
    await use(context);
    await context.close();
  },
  
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
