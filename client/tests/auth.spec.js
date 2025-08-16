const { test, expect } = require('@playwright/test');
const { setupTestAuth } = require('./helpers/auth-helper');

test.describe('Authentication', () => {
  test('should authenticate test user and access protected page', async ({ page }) => {
    // Setup authentication (this will login and navigate to dashboard/vendors)
    await setupTestAuth(page);
    
    // Should not be redirected to login
    await expect(page).not.toHaveURL(/.*login.*/);
    
    // Should show either dashboard or vendors page
    const currentUrl = page.url();
    if (currentUrl.includes('/vendors')) {
      await expect(page.locator('h1').filter({ hasText: 'Vendors' })).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
    }
  });

  test('should show user is authenticated', async ({ page }) => {
    // Setup authentication (this will login and navigate to dashboard/vendors)
    await setupTestAuth(page);
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    // Should show user information
    await expect(page.locator('text=Test User')).toBeVisible();
  });
});

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'differentpassword');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should navigate back to login', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing vendors page without authentication', async ({ page }) => {
    await page.goto('/vendors');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing profile page without authentication', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
  });
});