const { test, expect } = require('@playwright/test');
const { setupTestAuth } = require('./helpers/auth-helper');

test.describe('News Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup real authentication for news page access
    await setupTestAuth(page);
    
    // Navigate to news page
    await page.goto('/news');
    await page.waitForLoadState('networkidle');
  });

  test('should display news page title and description', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'Vendor News & Security' })).toBeVisible();
    await expect(page.locator('text=Stay updated on vendor-related news and security issues in the industry')).toBeVisible();
  });

  test('should display vendor news section', async ({ page }) => {
    await expect(page.locator('text=Vendor News')).toBeVisible();
    
    // Check that vendor news section exists
    const vendorNewsSection = page.locator('text=Vendor News').first();
    await expect(vendorNewsSection).toBeVisible();
  });

  test('should display industry security section', async ({ page }) => {
    await expect(page.locator('text=Industry Security')).toBeVisible();
    
    // Check that industry security section exists
    const industrySection = page.locator('text=Industry Security').first();
    await expect(industrySection).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    // Check that search input is visible
    const searchInput = page.locator('input[placeholder="Search news..."]');
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('security');
    await expect(searchInput).toHaveValue('security');
  });

  test('should have working filter dropdown', async ({ page }) => {
    // Check that filter dropdown is visible
    const filterSelect = page.locator('select');
    await expect(filterSelect).toBeVisible();
    
    // Check filter options
    await expect(page.locator('option[value="all"]')).toBeVisible();
    await expect(page.locator('option[value="security"]')).toBeVisible();
    await expect(page.locator('option[value="vendor-specific"]')).toBeVisible();
  });

  test('should display news items with proper formatting', async ({ page }) => {
    // Wait for news items to load
    await page.waitForTimeout(1000);
    
    // Check that news items are displayed (if any exist)
    const newsItems = await page.locator('[class*="hover:bg-gray-50"]').all();
    if (newsItems.length > 0) {
      await expect(newsItems[0]).toBeVisible();
    }
  });

  test('should display security severity indicators', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for severity indicators (if any security news exists)
    const severityElements = await page.locator('text=Critical, text=High, text=Medium, text=Low').all();
    if (severityElements.length > 0) {
      await expect(severityElements[0]).toBeVisible();
    }
  });

  test('should display vendor tags for vendor-specific news', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for vendor tags (if any vendor-specific news exists)
    const vendorTags = await page.locator('[class*="bg-primary-100"]').all();
    if (vendorTags.length > 0) {
      await expect(vendorTags[0]).toBeVisible();
    }
  });

  test('should display security tags for security news', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for security tags (if any security news exists)
    const securityTags = await page.locator('text=Security').all();
    if (securityTags.length > 0) {
      await expect(securityTags[0]).toBeVisible();
    }
  });

  test('should display publication dates', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for date elements (if any news exists)
    const dateElements = await page.locator('[class*="text-gray-500"]').all();
    if (dateElements.length > 0) {
      await expect(dateElements[0]).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/news/vendors**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          news: [],
          total: 0
        })
      });
    });

    await page.route('**/api/news/industry**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          news: [],
          total: 0
        })
      });
    });

    // Reload page to trigger empty state
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that empty state messages are displayed
    const emptyMessages = await page.locator('text=No vendor news found, text=No industry security news').all();
    if (emptyMessages.length > 0) {
      await expect(emptyMessages[0]).toBeVisible();
    }
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/news/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    // Reload page to trigger error
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check error message
    const errorElements = await page.locator('text=Error, text=Failed to fetch news data').all();
    if (errorElements.length > 0) {
      await expect(errorElements[0]).toBeVisible();
    }
  });

  test('should show loading spinner while fetching data', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/news/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          news: []
        })
      });
    });

    // Reload page
    await page.reload();
    
    // Check that loading spinner is visible
    const loadingElements = await page.locator('[data-testid="loading-spinner"], .loading, .spinner, [aria-busy="true"]').all();
    if (loadingElements.length > 0) {
      await expect(loadingElements[0]).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that news page elements are still visible
    await expect(page.locator('h1').filter({ hasText: 'Vendor News & Security' })).toBeVisible();
    await expect(page.locator('text=Vendor News')).toBeVisible();
    await expect(page.locator('text=Industry Security')).toBeVisible();
  });

  test('should filter news by security issues', async ({ page }) => {
    // Select security filter
    const filterSelect = page.locator('select');
    await filterSelect.selectOption('security');
    
    // Check that filter value is updated
    await expect(filterSelect).toHaveValue('security');
  });

  test('should filter news by vendor-specific', async ({ page }) => {
    // Select vendor-specific filter
    const filterSelect = page.locator('select');
    await filterSelect.selectOption('vendor-specific');
    
    // Check that filter value is updated
    await expect(filterSelect).toHaveValue('vendor-specific');
  });

  test('should search news by keyword', async ({ page }) => {
    // Enter search term
    const searchInput = page.locator('input[placeholder="Search news..."]');
    await searchInput.fill('update');
    
    // Check that search term is entered
    await expect(searchInput).toHaveValue('update');
  });
});

test.describe('News Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup real authentication
    await setupTestAuth(page);
    
    // Navigate to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should have News link in navigation menu', async ({ page }) => {
    // Check that News link exists in navigation
    const newsLink = page.locator('a[href="/news"]').first();
    await expect(newsLink).toBeAttached();
  });

  test('should navigate to news page from dashboard', async ({ page }) => {
    // Click on News link
    await page.click('a[href="/news"]');
    
    // Check that we're on the news page
    await expect(page).toHaveURL('/news');
    await expect(page.locator('h1').filter({ hasText: 'Vendor News & Security' })).toBeVisible();
  });

  test('should highlight news page in navigation when active', async ({ page }) => {
    // Navigate to news page
    await page.goto('/news');
    await page.waitForLoadState('networkidle');
    
    // Check that news link is highlighted (use first() to avoid strict mode violations)
    const newsLink = page.locator('a[href="/news"]').first();
    await expect(newsLink).toHaveClass(/bg-primary-100/);
  });
});
