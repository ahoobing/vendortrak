const { test, expect } = require('@playwright/test');

test.describe('Vendors Page', () => {
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
                email: 'contact@techsolutions.com',
                phone: '+1-555-0123',
                status: 'active',
                riskLevel: 'low',
                contractValue: '50000',
                industry: 'Technology',
                address: '123 Tech Street, Silicon Valley, CA',
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z'
              },
              {
                id: 2,
                name: 'Global Logistics',
                email: 'info@globallogistics.com',
                phone: '+1-555-0456',
                status: 'active',
                riskLevel: 'medium',
                contractValue: '75000',
                industry: 'Logistics',
                address: '456 Logistics Ave, New York, NY',
                createdAt: '2024-01-10T10:00:00Z',
                updatedAt: '2024-01-10T10:00:00Z'
              },
              {
                id: 3,
                name: 'Risky Ventures',
                email: 'hello@riskyventures.com',
                phone: '+1-555-0789',
                status: 'pending',
                riskLevel: 'high',
                contractValue: '25000',
                industry: 'Finance',
                address: '789 Risk Lane, Chicago, IL',
                createdAt: '2024-01-05T10:00:00Z',
                updatedAt: '2024-01-05T10:00:00Z'
              }
            ],
            total: 3,
            page: 1,
            limit: 10
          }
        }
      });
    });

    await page.goto('/vendors');
  });

  test('should display vendors page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vendors');
  });

  test('should display vendors table with all columns', async ({ page }) => {
    // Check table headers
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Phone')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Risk Level')).toBeVisible();
    await expect(page.locator('text=Contract Value')).toBeVisible();
    await expect(page.locator('text=Industry')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should display all vendors in the table', async ({ page }) => {
    // Check that all vendor names are displayed
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
    await expect(page.locator('text=Global Logistics')).toBeVisible();
    await expect(page.locator('text=Risky Ventures')).toBeVisible();
  });

  test('should display vendor details correctly', async ({ page }) => {
    // Check first vendor details
    await expect(page.locator('text=contact@techsolutions.com')).toBeVisible();
    await expect(page.locator('text=+1-555-0123')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Low Risk')).toBeVisible();
    await expect(page.locator('text=$50,000')).toBeVisible();
    await expect(page.locator('text=Technology')).toBeVisible();
  });

  test('should have add vendor button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Vendor")')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    // Check for filter dropdowns or buttons
    await expect(page.locator('select, button:has-text("Filter")')).toBeVisible();
  });

  test('should search vendors by name', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="search"]', 'Tech');
    
    // Check that only Tech Solutions Inc is visible
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
    await expect(page.locator('text=Global Logistics')).not.toBeVisible();
    await expect(page.locator('text=Risky Ventures')).not.toBeVisible();
  });

  test('should filter vendors by status', async ({ page }) => {
    // Click on status filter
    await page.click('button:has-text("Status")');
    await page.click('text=Active');
    
    // Check that only active vendors are visible
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
    await expect(page.locator('text=Global Logistics')).toBeVisible();
    await expect(page.locator('text=Risky Ventures')).not.toBeVisible();
  });

  test('should filter vendors by risk level', async ({ page }) => {
    // Click on risk level filter
    await page.click('button:has-text("Risk Level")');
    await page.click('text=High');
    
    // Check that only high risk vendors are visible
    await expect(page.locator('text=Risky Ventures')).toBeVisible();
    await expect(page.locator('text=Tech Solutions Inc')).not.toBeVisible();
    await expect(page.locator('text=Global Logistics')).not.toBeVisible();
  });

  test('should sort vendors by name', async ({ page }) => {
    // Click on name column header to sort
    await page.click('text=Name');
    
    // Check that vendors are sorted alphabetically
    const vendorNames = await page.locator('tbody tr td:first-child').allTextContents();
    expect(vendorNames).toEqual(['Global Logistics', 'Risky Ventures', 'Tech Solutions Inc']);
  });

  test('should sort vendors by contract value', async ({ page }) => {
    // Click on contract value column header to sort
    await page.click('text=Contract Value');
    
    // Check that vendors are sorted by contract value (descending)
    const contractValues = await page.locator('tbody tr td:nth-child(6)').allTextContents();
    expect(contractValues).toEqual(['$75,000', '$50,000', '$25,000']);
  });

  test('should open vendor detail page when clicking on vendor name', async ({ page }) => {
    // Click on first vendor name
    await page.click('text=Tech Solutions Inc');
    
    // Check that we're on the vendor detail page
    await expect(page).toHaveURL('/vendors/1');
  });

  test('should have edit and delete actions for each vendor', async ({ page }) => {
    // Check that action buttons are present for each vendor
    const actionButtons = await page.locator('button[aria-label*="Edit"], button[aria-label*="Delete"]').count();
    expect(actionButtons).toBeGreaterThan(0);
  });

  test('should open edit modal when clicking edit button', async ({ page }) => {
    // Click edit button for first vendor
    await page.click('button[aria-label*="Edit"]').first();
    
    // Check that edit modal is open
    await expect(page.locator('text=Edit Vendor')).toBeVisible();
  });

  test('should confirm deletion when clicking delete button', async ({ page }) => {
    // Mock delete API response
    await page.route('**/api/vendors/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Click delete button for first vendor
    await page.click('button[aria-label*="Delete"]').first();
    
    // Check that confirmation dialog is shown
    await expect(page.locator('text=Delete Vendor')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete this vendor?')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Mock paginated response
    await page.route('**/api/vendors**', async route => {
      const url = new URL(route.request().url());
      const page = url.searchParams.get('page') || '1';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vendors: [
              {
                id: parseInt(page),
                name: `Vendor Page ${page}`,
                email: `vendor${page}@example.com`,
                status: 'active',
                riskLevel: 'low',
                contractValue: '10000',
                industry: 'Technology'
              }
            ],
            total: 25,
            page: parseInt(page),
            limit: 10
          }
        }
      });
    });

    // Reload page
    await page.reload();
    
    // Check that pagination controls are visible
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    
    // Click next page
    await page.click('button:has-text("Next")');
    
    // Check that we're on page 2
    await expect(page.locator('text=Vendor Page 2')).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/vendors**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to load vendors'
        })
      });
    });

    // Reload page to trigger error
    await page.reload();
    
    // Check error message
    await expect(page.locator('text=Error loading vendors')).toBeVisible();
    await expect(page.locator('text=Failed to load vendors')).toBeVisible();
  });

  test('should show loading state while fetching vendors', async ({ page }) => {
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

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that vendors page elements are still visible
    await expect(page.locator('h1')).toContainText('Vendors');
    await expect(page.locator('button:has-text("Add Vendor")')).toBeVisible();
  });
});

test.describe('Add Vendor', () => {
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

    await page.goto('/vendors');
  });

  test('should open add vendor modal when clicking add button', async ({ page }) => {
    // Click add vendor button
    await page.click('button:has-text("Add Vendor")');
    
    // Check that modal is open
    await expect(page.locator('text=Add New Vendor')).toBeVisible();
  });

  test('should display all required form fields', async ({ page }) => {
    // Open add vendor modal
    await page.click('button:has-text("Add Vendor")');
    
    // Check form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    await expect(page.locator('select[name="riskLevel"]')).toBeVisible();
    await expect(page.locator('input[name="contractValue"]')).toBeVisible();
    await expect(page.locator('input[name="industry"]')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open add vendor modal
    await page.click('button:has-text("Add Vendor")');
    
    // Try to submit empty form
    await page.click('button:has-text("Save")');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should successfully add a new vendor', async ({ page }) => {
    // Mock successful add vendor response
    await page.route('**/api/vendors', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 4,
            name: 'New Vendor',
            email: 'new@vendor.com'
          }
        })
      });
    });

    // Open add vendor modal
    await page.click('button:has-text("Add Vendor")');
    
    // Fill in form
    await page.fill('input[name="name"]', 'New Vendor');
    await page.fill('input[name="email"]', 'new@vendor.com');
    await page.fill('input[name="phone"]', '+1-555-9999');
    await page.selectOption('select[name="status"]', 'active');
    await page.selectOption('select[name="riskLevel"]', 'low');
    await page.fill('input[name="contractValue"]', '30000');
    await page.fill('input[name="industry"]', 'Technology');
    await page.fill('textarea[name="address"]', '123 New Street, City, State');
    
    // Submit form
    await page.click('button:has-text("Save")');
    
    // Check that modal is closed
    await expect(page.locator('text=Add New Vendor')).not.toBeVisible();
  });
});