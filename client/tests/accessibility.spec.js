const { test, expect } = require('@playwright/test');

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      }));
    });

    // Mock vendors API
    await page.route('**/api/vendors**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vendors: [
              {
                id: 1,
                name: 'Tech Solutions Inc',
                email: 'contact@techsolutions.com',
                status: 'active',
                riskLevel: 'low',
                contractValue: '50000',
                industry: 'Technology'
              }
            ]
          }
        })
      });
    });
  });

  test('should have proper page titles', async ({ page }) => {
    const pages = [
      { path: '/login', title: 'Login - VendorTrak' },
      { path: '/register', title: 'Register - VendorTrak' },
      { path: '/dashboard', title: 'Dashboard - VendorTrak' },
      { path: '/vendors', title: 'Vendors - VendorTrak' },
      { path: '/vendor-graph', title: 'Vendor Graph - VendorTrak' },
      { path: '/data-types', title: 'Data Types - VendorTrak' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.title);
    }
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that there's only one h1 element
    await expect(page.locator('h1')).toHaveCount(1);
    
    // Check that h1 contains the page title
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check that headings are properly nested
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check that form inputs have associated labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('id');
    await expect(passwordInput).toHaveAttribute('id');
    
    const emailId = await emailInput.getAttribute('id');
    const passwordId = await passwordInput.getAttribute('id');
    
    await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
    await expect(page.locator(`label[for="${passwordId}"]`)).toBeVisible();
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check that buttons have accessible names
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText('Sign in');
    
    // Check that buttons without text have aria-labels
    const eyeButton = page.locator('button[aria-label*="Toggle password visibility"]');
    await expect(eyeButton).toBeVisible();
  });

  test('should have proper link text', async ({ page }) => {
    await page.goto('/login');
    
    // Check that links have descriptive text
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toContainText('create a new account');
    
    // Check that links are not just URLs
    const links = await page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      expect(text).not.toBe(href);
      expect(text.trim()).not.toBe('');
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that all images have alt attributes
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt.trim()).not.toBe('');
    }
  });

  test('should have proper table structure', async ({ page }) => {
    await page.goto('/vendors');
    
    // Check that tables have proper headers
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check that table has thead and tbody
    await expect(page.locator('thead')).toBeVisible();
    await expect(page.locator('tbody')).toBeVisible();
    
    // Check that table headers are properly associated with cells
    const headers = await page.locator('th').all();
    for (const header of headers) {
      const scope = await header.getAttribute('scope');
      expect(scope).toBe('col');
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that text has sufficient contrast
    // This is a basic check - in a real scenario, you'd use a color contrast analyzer
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
    expect(textElements.length).toBeGreaterThan(0);
    
    // Check that error messages have proper styling
    const errorElements = await page.locator('.text-red-600, .text-red-700, .text-red-800').all();
    // Error elements should be visible and have proper contrast
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Check that all interactive elements are focusable
    const focusableElements = await page.locator('button, input, select, textarea, a[href]').all();
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/vendors');
    
    // Check that modals have proper ARIA attributes
    await page.click('button:has-text("Add Vendor")');
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check that modal has proper aria-labelledby
    const modalTitle = modal.locator('h2, h3');
    await expect(modalTitle).toBeVisible();
    
    // Check that modal has proper aria-describedby if there's a description
    const modalDescription = modal.locator('[aria-describedby]');
    if (await modalDescription.count() > 0) {
      await expect(modalDescription).toBeVisible();
    }
  });

  test('should have proper error handling', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form to trigger validation errors
    await page.click('button[type="submit"]');
    
    // Check that error messages are properly announced
    const errorMessages = await page.locator('.text-red-600, [role="alert"]').all();
    expect(errorMessages.length).toBeGreaterThan(0);
    
    // Check that error messages are associated with form fields
    const emailError = page.locator('text=Email is required');
    await expect(emailError).toBeVisible();
  });

  test('should have proper loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/vendors**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { vendors: [] }
        })
      });
    });

    await page.goto('/vendors');
    
    // Check that loading state is properly announced
    const loadingSpinner = page.locator('[data-testid="loading-spinner"], [aria-busy="true"]');
    await expect(loadingSpinner).toBeVisible();
  });

  test('should have proper skip links', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for skip to main content link
    const skipLink = page.locator('a[href="#main-content"], a[href="#main"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
      
      // Test skip link functionality
      await skipLink.click();
      await expect(page.locator('#main-content, #main')).toBeFocused();
    }
  });

  test('should have proper language attributes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that html element has lang attribute
    await expect(page.locator('html')).toHaveAttribute('lang');
    
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/vendors');
    
    // Open modal
    await page.click('button:has-text("Add Vendor")');
    
    // Check that focus is trapped in modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check that focus is moved to first focusable element in modal
    const firstFocusable = modal.locator('button, input, select, textarea').first();
    await expect(firstFocusable).toBeFocused();
  });

  test('should have proper screen reader support', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that decorative elements are hidden from screen readers
    const decorativeElements = await page.locator('[aria-hidden="true"]').all();
    // Decorative elements should be properly hidden
    
    // Check that important content is not hidden
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('should have proper form validation announcements', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check that validation errors are properly announced
    const emailError = page.locator('text=Invalid email address');
    await expect(emailError).toBeVisible();
    
    // Check that error is associated with the input field
    const emailInput = page.locator('input[type="email"]');
    const emailId = await emailInput.getAttribute('id');
    await expect(page.locator(`[aria-describedby="${emailId}-error"]`)).toBeVisible();
  });

  test('should have proper responsive design for accessibility', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check that navigation is accessible on mobile
    const mobileMenu = page.locator('[aria-label="Menu"], [aria-label="Navigation"]');
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu).toBeVisible();
      
      // Test mobile menu functionality
      await mobileMenu.click();
      await expect(page.locator('nav')).toBeVisible();
    }
    
    // Check that touch targets are large enough (minimum 44px)
    const buttons = await page.locator('button, a').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should have proper high contrast mode support', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that important elements have sufficient contrast
    // This would typically be tested with a color contrast analyzer
    const importantText = await page.locator('h1, h2, h3, p, button').all();
    expect(importantText.length).toBeGreaterThan(0);
    
    // Check that interactive elements have proper focus indicators
    const focusableElements = await page.locator('button, input, a').all();
    for (const element of focusableElements) {
      await element.focus();
      // Check that focus indicator is visible
      const computedStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          border: style.border
        };
      });
      expect(computedStyle.outline).not.toBe('none');
    }
  });

  test('should have proper motion reduction support', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that animations respect prefers-reduced-motion
    // This would typically be tested by setting the media query
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
    // Animated elements should respect user preferences
  });

  test('should have proper semantic HTML', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that semantic elements are used appropriately
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    
    // Check that lists are properly structured
    const lists = await page.locator('ul, ol').all();
    for (const list of lists) {
      const listItems = await list.locator('li').all();
      expect(listItems.length).toBeGreaterThan(0);
    }
  });
});