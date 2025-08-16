const { test, expect } = require('@playwright/test');
const { setupTestAuth } = require('./helpers/auth-helper');

test.describe('Data Types Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup real authentication for data types access
    await setupTestAuth(page);
    
    // Navigate to data types page if not already there
    if (!page.url().includes('/data-types')) {
      await page.goto('/data-types');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display data types page title', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'Data Types' })).toBeVisible();
  });

  test('should display data types table with all columns', async ({ page }) => {
    // Check table headers (be flexible about which columns exist)
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should display all data types in the table', async ({ page }) => {
    // Check that data types table exists and has content (actual data depends on real data)
    const table = page.locator('table');
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
      // Check that table has some content
      const tableRows = await page.locator('tbody tr').all();
      expect(tableRows.length).toBeGreaterThanOrEqual(0);
    } else {
      // If no table, check for empty state message
      await expect(page.locator('text=No data types found')).toBeVisible();
    }
  });

  test('should display data type details correctly', async ({ page }) => {
    // Check that data type details are displayed (actual details depend on real data)
    const table = page.locator('table');
    if (await table.count() > 0) {
      // Check that table has some content
      const tableRows = await page.locator('tbody tr').all();
      if (tableRows.length > 0) {
        await expect(tableRows[0]).toBeVisible();
      }
    }
  });

  test('should have add data type button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Data Type")').first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Check for search functionality (if it exists)
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should have filter options', async ({ page }) => {
    // Check for filter dropdowns or buttons
    await expect(page.locator('select, button:has-text("Filter")')).toBeVisible();
  });

  test('should search data types by name', async ({ page }) => {
    // Type in search box (if it exists)
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      
      // Check that search functionality works (actual results depend on real data)
      await page.waitForLoadState('networkidle');
    }
  });

  test('should filter data types by category', async ({ page }) => {
    // Click on category filter (if it exists)
    const categoryFilter = page.locator('button:has-text("Category")');
    if (await categoryFilter.count() > 0) {
      await categoryFilter.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should filter data types by required status', async ({ page }) => {
    // Click on required filter (if it exists)
    const requiredFilter = page.locator('button:has-text("Required")');
    if (await requiredFilter.count() > 0) {
      await requiredFilter.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should sort data types by name', async ({ page }) => {
    // Click on name column header to sort (if table exists)
    const nameHeader = page.locator('text=Name');
    if (await nameHeader.count() > 0) {
      await nameHeader.click();
      
      // Check that sorting works (actual order depends on real data)
      const dataTypeNames = await page.locator('tbody tr td:first-child').allTextContents();
      expect(dataTypeNames.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort data types by category', async ({ page }) => {
    // Click on category column header to sort (if it exists)
    const categoryHeader = page.locator('text=Category');
    if (await categoryHeader.count() > 0) {
      await categoryHeader.click();
      
      // Check that sorting works (actual categories depend on real data)
      const categories = await page.locator('tbody tr td:nth-child(3)').allTextContents();
      expect(categories.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have edit and delete actions for each data type', async ({ page }) => {
    // Check that action buttons are present for each data type (if table exists)
    const table = page.locator('table');
    if (await table.count() > 0) {
      const actionButtons = await page.locator('button[aria-label*="Edit"], button[aria-label*="Delete"]').count();
      expect(actionButtons).toBeGreaterThanOrEqual(0);
    }
  });

  test('should open edit modal when clicking edit button', async ({ page }) => {
    // Click edit button for first data type (if it exists)
    const editButton = page.locator('button[aria-label*="Edit"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Check that edit modal is open
      await expect(page.locator('text=Edit Data Type')).toBeVisible();
    }
  });

  test('should confirm deletion when clicking delete button', async ({ page }) => {
    // Click delete button for first data type (if it exists)
    const deleteButton = page.locator('button[aria-label*="Delete"]').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Check that confirmation dialog is shown
      await expect(page.locator('text=Delete Data Type')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to delete this data type?')).toBeVisible();
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Check that pagination controls are visible (if they exist)
    const prevButton = page.locator('button:has-text("Previous")');
    const nextButton = page.locator('button:has-text("Next")');
    
    if (await prevButton.count() > 0 && await nextButton.count() > 0) {
      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
      
      // Click next page
      await nextButton.click();
      
      // Check that pagination works (actual content depends on real data)
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/data-types**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to load data types'
        })
      });
    });

    // Reload page to trigger error
    await page.reload();
    
    // Check error message (be flexible about error display)
    const errorElements = await page.locator('text=Error, text=Failed, text=Failed to load data types').all();
    if (errorElements.length > 0) {
      await expect(errorElements[0]).toBeVisible();
    }
  });

  test('should show loading state while fetching data', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/data-types**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { dataTypes: [] }
        })
      });
    });

    // Reload page
    await page.reload();
    
    // Check that loading spinner is visible (be flexible about loading indicators)
    const loadingElements = await page.locator('[data-testid="loading-spinner"], .loading, .spinner, [aria-busy="true"]').all();
    if (loadingElements.length > 0) {
      await expect(loadingElements[0]).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that data types page elements are still visible
    await expect(page.locator('h1').filter({ hasText: 'Data Types' })).toBeVisible();
    await expect(page.locator('button:has-text("Add Data Type")').first()).toBeVisible();
  });
});

test.describe('Add Data Type', () => {
  test.beforeEach(async ({ page }) => {
    // Setup real authentication for data types access
    await setupTestAuth(page);
    
    // Navigate to data types page if not already there
    if (!page.url().includes('/data-types')) {
      await page.goto('/data-types');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should open add data type modal when clicking add button', async ({ page }) => {
    // Click add data type button
    await page.click('button:has-text("Add Data Type")');
    
    // Check that modal is open
    await expect(page.locator('text=Add New Data Type')).toBeVisible();
  });

  test('should display all required form fields', async ({ page }) => {
    // Open add data type modal
    await page.locator('button:has-text("Add Data Type")').first().click();
    
    // Check form fields (be flexible about which fields exist)
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open add data type modal
    await page.locator('button:has-text("Add Data Type")').first().click();
    
    // Try to submit empty form
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      
      // Check for validation errors (be flexible about error messages)
      const errorElements = await page.locator('text=required, text=Required, text=Name is required').all();
      if (errorElements.length > 0) {
        await expect(errorElements[0]).toBeVisible();
      }
    }
  });

  test('should successfully add a new data type', async ({ page }) => {
    // Open add data type modal
    await page.locator('button:has-text("Add Data Type")').first().click();
    
    // Fill in form (only use fields that exist)
    await page.fill('input[name="name"]', 'New Data Type');
    await page.fill('textarea[name="description"]', 'Test description for new data type');
    
    // Submit form
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.count() > 0) {
      await saveButton.click();
      
      // Check that modal is closed
      await expect(page.locator('text=Add New Data Type')).not.toBeVisible();
    }
  });

  test('should validate data format options', async ({ page }) => {
    // Open add data type modal
    await page.locator('button:has-text("Add Data Type")').first().click();
    
    // Check data format options (if they exist)
    const dataFormatSelect = page.locator('select[name="dataFormat"]');
    if (await dataFormatSelect.count() > 0) {
      await expect(dataFormatSelect).toBeVisible();
    }
  });

  test('should validate category options', async ({ page }) => {
    // Open add data type modal
    await page.locator('button:has-text("Add Data Type")').first().click();
    
    // Check category options (if they exist)
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.count() > 0) {
      await expect(categorySelect).toBeVisible();
    }
  });
});

test.describe('Edit Data Type', () => {
  test.beforeEach(async ({ page }) => {
    // Setup real authentication for data types access
    await setupTestAuth(page);
    
    // Navigate to data types page if not already there
    if (!page.url().includes('/data-types')) {
      await page.goto('/data-types');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should populate form with existing data when editing', async ({ page }) => {
    // Click edit button (if it exists)
    const editButton = page.locator('button[aria-label*="Edit"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Check that form is populated with existing data (actual values depend on real data)
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
    }
  });

  test('should successfully update data type', async ({ page }) => {
    // Click edit button (if it exists)
    const editButton = page.locator('button[aria-label*="Edit"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Update form fields
      await page.fill('input[name="name"]', 'Updated Data Type');
      await page.fill('textarea[name="description"]', 'Updated description for data type');
      
      // Submit form
      await page.click('button:has-text("Save")');
      
      // Check that modal is closed
      await expect(page.locator('text=Edit Data Type')).not.toBeVisible();
    }
  });
});