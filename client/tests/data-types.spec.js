const { test, expect } = require('@playwright/test');

test.describe('Data Types Page', () => {
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

    // Mock data types API response
    await page.route('**/api/data-types**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            dataTypes: [
              {
                id: 1,
                name: 'Vendor Information',
                description: 'Basic vendor contact and company information',
                category: 'Contact',
                required: true,
                dataFormat: 'text',
                validationRules: ['required', 'max_length:255'],
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z'
              },
              {
                id: 2,
                name: 'Contract Value',
                description: 'Monetary value of vendor contracts',
                category: 'Financial',
                required: true,
                dataFormat: 'currency',
                validationRules: ['required', 'numeric', 'min:0'],
                createdAt: '2024-01-10T10:00:00Z',
                updatedAt: '2024-01-10T10:00:00Z'
              },
              {
                id: 3,
                name: 'Risk Assessment',
                description: 'Vendor risk level and assessment data',
                category: 'Risk',
                required: false,
                dataFormat: 'select',
                validationRules: ['in:low,medium,high'],
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

    await page.goto('/data-types');
  });

  test('should display data types page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Data Types');
  });

  test('should display data types table with all columns', async ({ page }) => {
    // Check table headers
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
    await expect(page.locator('text=Required')).toBeVisible();
    await expect(page.locator('text=Data Format')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should display all data types in the table', async ({ page }) => {
    // Check that all data type names are displayed
    await expect(page.locator('text=Vendor Information')).toBeVisible();
    await expect(page.locator('text=Contract Value')).toBeVisible();
    await expect(page.locator('text=Risk Assessment')).toBeVisible();
  });

  test('should display data type details correctly', async ({ page }) => {
    // Check first data type details
    await expect(page.locator('text=Basic vendor contact and company information')).toBeVisible();
    await expect(page.locator('text=Contact')).toBeVisible();
    await expect(page.locator('text=Required')).toBeVisible();
    await expect(page.locator('text=text')).toBeVisible();
  });

  test('should have add data type button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Data Type")')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    // Check for filter dropdowns or buttons
    await expect(page.locator('select, button:has-text("Filter")')).toBeVisible();
  });

  test('should search data types by name', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="search"]', 'Vendor');
    
    // Check that only Vendor Information is visible
    await expect(page.locator('text=Vendor Information')).toBeVisible();
    await expect(page.locator('text=Contract Value')).not.toBeVisible();
    await expect(page.locator('text=Risk Assessment')).not.toBeVisible();
  });

  test('should filter data types by category', async ({ page }) => {
    // Click on category filter
    await page.click('button:has-text("Category")');
    await page.click('text=Contact');
    
    // Check that only Contact category data types are visible
    await expect(page.locator('text=Vendor Information')).toBeVisible();
    await expect(page.locator('text=Contract Value')).not.toBeVisible();
    await expect(page.locator('text=Risk Assessment')).not.toBeVisible();
  });

  test('should filter data types by required status', async ({ page }) => {
    // Click on required filter
    await page.click('button:has-text("Required")');
    await page.click('text=Required');
    
    // Check that only required data types are visible
    await expect(page.locator('text=Vendor Information')).toBeVisible();
    await expect(page.locator('text=Contract Value')).toBeVisible();
    await expect(page.locator('text=Risk Assessment')).not.toBeVisible();
  });

  test('should sort data types by name', async ({ page }) => {
    // Click on name column header to sort
    await page.click('text=Name');
    
    // Check that data types are sorted alphabetically
    const dataTypeNames = await page.locator('tbody tr td:first-child').allTextContents();
    expect(dataTypeNames).toEqual(['Contract Value', 'Risk Assessment', 'Vendor Information']);
  });

  test('should sort data types by category', async ({ page }) => {
    // Click on category column header to sort
    await page.click('text=Category');
    
    // Check that data types are sorted by category
    const categories = await page.locator('tbody tr td:nth-child(3)').allTextContents();
    expect(categories).toEqual(['Contact', 'Financial', 'Risk']);
  });

  test('should have edit and delete actions for each data type', async ({ page }) => {
    // Check that action buttons are present for each data type
    const actionButtons = await page.locator('button[aria-label*="Edit"], button[aria-label*="Delete"]').count();
    expect(actionButtons).toBeGreaterThan(0);
  });

  test('should open edit modal when clicking edit button', async ({ page }) => {
    // Click edit button for first data type
    await page.click('button[aria-label*="Edit"]').first();
    
    // Check that edit modal is open
    await expect(page.locator('text=Edit Data Type')).toBeVisible();
  });

  test('should confirm deletion when clicking delete button', async ({ page }) => {
    // Mock delete API response
    await page.route('**/api/data-types/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Click delete button for first data type
    await page.click('button[aria-label*="Delete"]').first();
    
    // Check that confirmation dialog is shown
    await expect(page.locator('text=Delete Data Type')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete this data type?')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Mock paginated response
    await page.route('**/api/data-types**', async route => {
      const url = new URL(route.request().url());
      const page = url.searchParams.get('page') || '1';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            dataTypes: [
              {
                id: parseInt(page),
                name: `Data Type ${page}`,
                description: `Description for data type ${page}`,
                category: 'Test',
                required: true,
                dataFormat: 'text'
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
    await expect(page.locator('text=Data Type 2')).toBeVisible();
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
    
    // Check error message
    await expect(page.locator('text=Error loading data types')).toBeVisible();
    await expect(page.locator('text=Failed to load data types')).toBeVisible();
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
    
    // Check that loading spinner is visible
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that data types page elements are still visible
    await expect(page.locator('h1')).toContainText('Data Types');
    await expect(page.locator('button:has-text("Add Data Type")')).toBeVisible();
  });
});

test.describe('Add Data Type', () => {
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

    // Mock data types API
    await page.route('**/api/data-types**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { dataTypes: [] }
        })
      });
    });

    await page.goto('/data-types');
  });

  test('should open add data type modal when clicking add button', async ({ page }) => {
    // Click add data type button
    await page.click('button:has-text("Add Data Type")');
    
    // Check that modal is open
    await expect(page.locator('text=Add New Data Type')).toBeVisible();
  });

  test('should display all required form fields', async ({ page }) => {
    // Open add data type modal
    await page.click('button:has-text("Add Data Type")');
    
    // Check form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
    await expect(page.locator('input[name="required"]')).toBeVisible();
    await expect(page.locator('select[name="dataFormat"]')).toBeVisible();
    await expect(page.locator('textarea[name="validationRules"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open add data type modal
    await page.click('button:has-text("Add Data Type")');
    
    // Try to submit empty form
    await page.click('button:has-text("Save")');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });

  test('should successfully add a new data type', async ({ page }) => {
    // Mock successful add data type response
    await page.route('**/api/data-types', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 4,
            name: 'New Data Type',
            description: 'Test description'
          }
        })
      });
    });

    // Open add data type modal
    await page.click('button:has-text("Add Data Type")');
    
    // Fill in form
    await page.fill('input[name="name"]', 'New Data Type');
    await page.fill('textarea[name="description"]', 'Test description for new data type');
    await page.selectOption('select[name="category"]', 'Test');
    await page.check('input[name="required"]');
    await page.selectOption('select[name="dataFormat"]', 'text');
    await page.fill('textarea[name="validationRules"]', 'required,max_length:255');
    
    // Submit form
    await page.click('button:has-text("Save")');
    
    // Check that modal is closed
    await expect(page.locator('text=Add New Data Type')).not.toBeVisible();
  });

  test('should validate data format options', async ({ page }) => {
    // Open add data type modal
    await page.click('button:has-text("Add Data Type")');
    
    // Check data format options
    const dataFormatSelect = page.locator('select[name="dataFormat"]');
    await expect(dataFormatSelect.locator('option[value="text"]')).toBeVisible();
    await expect(dataFormatSelect.locator('option[value="number"]')).toBeVisible();
    await expect(dataFormatSelect.locator('option[value="email"]')).toBeVisible();
    await expect(dataFormatSelect.locator('option[value="date"]')).toBeVisible();
    await expect(dataFormatSelect.locator('option[value="select"]')).toBeVisible();
    await expect(dataFormatSelect.locator('option[value="currency"]')).toBeVisible();
  });

  test('should validate category options', async ({ page }) => {
    // Open add data type modal
    await page.click('button:has-text("Add Data Type")');
    
    // Check category options
    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect.locator('option[value="Contact"]')).toBeVisible();
    await expect(categorySelect.locator('option[value="Financial"]')).toBeVisible();
    await expect(categorySelect.locator('option[value="Risk"]')).toBeVisible();
    await expect(categorySelect.locator('option[value="Compliance"]')).toBeVisible();
    await expect(categorySelect.locator('option[value="Performance"]')).toBeVisible();
  });
});

test.describe('Edit Data Type', () => {
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

    // Mock data types API
    await page.route('**/api/data-types**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            dataTypes: [
              {
                id: 1,
                name: 'Vendor Information',
                description: 'Basic vendor contact and company information',
                category: 'Contact',
                required: true,
                dataFormat: 'text',
                validationRules: 'required,max_length:255'
              }
            ]
          }
        })
      });
    });

    await page.goto('/data-types');
  });

  test('should populate form with existing data when editing', async ({ page }) => {
    // Click edit button
    await page.click('button[aria-label*="Edit"]').first();
    
    // Check that form is populated with existing data
    await expect(page.locator('input[name="name"]')).toHaveValue('Vendor Information');
    await expect(page.locator('textarea[name="description"]')).toHaveValue('Basic vendor contact and company information');
    await expect(page.locator('select[name="category"]')).toHaveValue('Contact');
    await expect(page.locator('input[name="required"]')).toBeChecked();
    await expect(page.locator('select[name="dataFormat"]')).toHaveValue('text');
    await expect(page.locator('textarea[name="validationRules"]')).toHaveValue('required,max_length:255');
  });

  test('should successfully update data type', async ({ page }) => {
    // Mock successful update response
    await page.route('**/api/data-types/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            name: 'Updated Vendor Information',
            description: 'Updated description'
          }
        })
      });
    });

    // Click edit button
    await page.click('button[aria-label*="Edit"]').first();
    
    // Update form fields
    await page.fill('input[name="name"]', 'Updated Vendor Information');
    await page.fill('textarea[name="description"]', 'Updated description for vendor information');
    
    // Submit form
    await page.click('button:has-text("Save")');
    
    // Check that modal is closed
    await expect(page.locator('text=Edit Data Type')).not.toBeVisible();
  });
});