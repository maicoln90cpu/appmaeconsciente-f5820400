import fs from 'fs';
import path from 'path';

import { chromium, FullConfig } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
const AUTH_DIR = path.join(__dirname, '.auth');
const STORAGE_STATE_PATH = path.join(AUTH_DIR, 'user.json');

async function globalSetup(config: FullConfig) {
  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to auth page
    await page.goto(`${baseURL}/auth`);
    
    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill and submit login form
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL(/\/(materiais|dashboard)/, { timeout: 15000 });
    
    // Save authenticated state
    await context.storageState({ path: STORAGE_STATE_PATH });
    
    console.log('✅ Authentication setup complete');
  } catch (error) {
    console.warn('⚠️ Could not authenticate test user. Tests requiring auth may fail.');
    console.warn('Make sure TEST_USER_EMAIL and TEST_USER_PASSWORD are set.');
    
    // Save empty state to prevent errors
    await context.storageState({ path: STORAGE_STATE_PATH });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
