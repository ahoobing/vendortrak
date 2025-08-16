const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('should display login form with all required elements', async ({ page }) => {
    // Check that the login form is visible
    await expect(page.locator('h2')).toContainText('Sign in to VendorTrak');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check labels
    await expect(page.locator('label[for="email"]')).toContainText('Email address');
    await expect(page.locator('label[for="password"]')).toContainText('Password');
    
    // Check register link
    await expect(page.locator('a[href="/register"]')).toContainText('create a new account');
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for email validation error
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    // Fill in valid email and short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for password validation error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    // Fill in password
    await page.fill('input[type="password"]', 'password123');
    
    // Check initial state (password should be hidden)
    await expect(page.locator('input[type="password"]')).toHaveAttribute('type', 'password');
    
    // Click eye icon to show password
    await page.click('button[aria-label="Toggle password visibility"]');
    
    // Check that password is now visible
    await expect(page.locator('input[type="text"]')).toBeVisible();
    
    // Click eye icon again to hide password
    await page.click('button[aria-label="Toggle password visibility"]');
    
    // Check that password is hidden again
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on register link
    await page.click('a[href="/register"]');
    
    // Check that we're on the register page
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h2')).toContainText('Create your account');
  });

  test('should show forgot password button', async ({ page }) => {
    // Check that forgot password link is visible
    await expect(page.locator('text=Forgot your password?')).toBeVisible();
  });

  test('should handle successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User'
          },
          token: 'mock-jwt-token'
        })
      });
    });

    // Fill in valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check that we're redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle login failure', async ({ page }) => {
    // Mock failed login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      });
    });

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Login Failed')).toBeVisible();
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should dismiss login error', async ({ page }) => {
    // Mock failed login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      });
    });

    // Fill in credentials and submit to trigger error
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error to appear
    await expect(page.locator('text=Login Failed')).toBeVisible();
    
    // Click dismiss button
    await page.click('button[aria-label="Dismiss error"]');
    
    // Check that error is dismissed
    await expect(page.locator('text=Login Failed')).not.toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Mock slow login response
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, email: 'test@example.com' },
          token: 'mock-jwt-token'
        })
      });
    });

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check that button shows loading state
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
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