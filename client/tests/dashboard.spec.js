const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
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

    // Mock vendors API response
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
                status: 'active',
                riskLevel: 'low',
                contractValue: '50000',
                industry: 'Technology',
                createdAt: '2024-01-15T10:00:00Z'
              },
              {
                id: 2,
                name: 'Global Logistics',
                status: 'active',
                riskLevel: 'medium',
                contractValue: '75000',
                industry: 'Logistics',
                createdAt: '2024-01-10T10:00:00Z'
              },
              {
                id: 3,
                name: 'Risky Ventures',
                status: 'pending',
                riskLevel: 'high',
                contractValue: '25000',
                industry: 'Finance',
                createdAt: '2024-01-05T10:00:00Z'
              }
            ]
          }
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard title and welcome message', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome to your vendor management dashboard')).toBeVisible();
  });

  test('should display vendor statistics cards', async ({ page }) => {
    // Check that all stat cards are visible
    await expect(page.locator('text=Total Vendors')).toBeVisible();
    await expect(page.locator('text=Active Vendors')).toBeVisible();
    await expect(page.locator('text=Total Contract Value')).toBeVisible();
    await expect(page.locator('text=High Risk Vendors')).toBeVisible();
  });

  test('should display correct vendor counts', async ({ page }) => {
    // Check total vendors count
    await expect(page.locator('text=3')).toBeVisible(); // Total vendors from mock data
    
    // Check active vendors count
    await expect(page.locator('text=2')).toBeVisible(); // 2 active vendors
    
    // Check high risk vendors count
    await expect(page.locator('text=1')).toBeVisible(); // 1 high risk vendor
  });

  test('should display total contract value', async ({ page }) => {
    // Total contract value should be $150,000 (50000 + 75000 + 25000)
    await expect(page.locator('text=$150,000')).toBeVisible();
  });

  test('should display recent vendors section', async ({ page }) => {
    await expect(page.locator('text=Recent Vendors')).toBeVisible();
    
    // Check that vendor names are displayed
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
    await expect(page.locator('text=Global Logistics')).toBeVisible();
    await expect(page.locator('text=Risky Ventures')).toBeVisible();
  });

  test('should display industry statistics', async ({ page }) => {
    await expect(page.locator('text=Top Industries')).toBeVisible();
    
    // Check that industries are displayed
    await expect(page.locator('text=Technology')).toBeVisible();
    await expect(page.locator('text=Logistics')).toBeVisible();
    await expect(page.locator('text=Finance')).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/vendors**', async route => {
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
    
    // Check error message
    await expect(page.locator('text=Error loading vendors')).toBeVisible();
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should show loading spinner while fetching data', async ({ page }) => {
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

    // Reload page
    await page.reload();
    
    // Check that loading spinner is visible
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should navigate to vendors page from dashboard', async ({ page }) => {
    // Click on vendors link in navigation
    await page.click('a[href="/vendors"]');
    
    // Check that we're on the vendors page
    await expect(page).toHaveURL('/vendors');
  });

  test('should navigate to vendor graph page', async ({ page }) => {
    // Click on vendor graph link
    await page.click('a[href="/vendor-graph"]');
    
    // Check that we're on the vendor graph page
    await expect(page).toHaveURL('/vendor-graph');
  });

  test('should display vendor status indicators', async ({ page }) => {
    // Check for status indicators in recent vendors
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should display risk level indicators', async ({ page }) => {
    // Check for risk level indicators
    await expect(page.locator('text=Low Risk')).toBeVisible();
    await expect(page.locator('text=Medium Risk')).toBeVisible();
    await expect(page.locator('text=High Risk')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that dashboard elements are still visible
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Total Vendors')).toBeVisible();
    await expect(page.locator('text=Recent Vendors')).toBeVisible();
  });

  test('should refresh data when page is reloaded', async ({ page }) => {
    // Get initial data
    const initialVendorCount = await page.locator('text=3').count();
    
    // Mock updated data
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
                name: 'Updated Vendor',
                status: 'active',
                riskLevel: 'low',
                contractValue: '100000',
                industry: 'Technology',
                createdAt: '2024-01-15T10:00:00Z'
              }
            ]
          }
        })
      });
    });

    // Reload page
    await page.reload();
    
    // Check that data is updated
    await expect(page.locator('text=1')).toBeVisible(); // New total count
    await expect(page.locator('text=Updated Vendor')).toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
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
          data: { vendors: [] }
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check all navigation links
    const navLinks = [
      { href: '/dashboard', text: 'Dashboard' },
      { href: '/vendors', text: 'Vendors' },
      { href: '/vendor-graph', text: 'Vendor Graph' },
      { href: '/data-types', text: 'Data Types' },
      { href: '/users', text: 'Users' },
      { href: '/profile', text: 'Profile' },
      { href: '/settings', text: 'Settings' }
    ];

    for (const link of navLinks) {
      await expect(page.locator(`a[href="${link.href}"]`)).toBeVisible();
    }
  });

  test('should highlight current page in navigation', async ({ page }) => {
    // Dashboard should be highlighted as current page
    await expect(page.locator('a[href="/dashboard"]')).toHaveClass(/active/);
  });

  test('should navigate to all main sections', async ({ page }) => {
    const pages = [
      { href: '/vendors', title: 'Vendors' },
      { href: '/vendor-graph', title: 'Vendor Graph' },
      { href: '/data-types', title: 'Data Types' },
      { href: '/users', title: 'Users' },
      { href: '/profile', title: 'Profile' },
      { href: '/settings', title: 'Settings' }
    ];

    for (const pageInfo of pages) {
      await page.click(`a[href="${pageInfo.href}"]`);
      await expect(page).toHaveURL(pageInfo.href);
      
      // Go back to dashboard for next test
      await page.goto('/dashboard');
    }
  });
});