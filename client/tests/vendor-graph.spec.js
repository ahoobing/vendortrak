const { test, expect } = require('@playwright/test');

test.describe('Vendor Graph Page', () => {
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

    // Mock vendors API response for graph data
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
                relationships: [
                  { vendorId: 2, type: 'subcontractor', strength: 'high' },
                  { vendorId: 3, type: 'partner', strength: 'medium' }
                ]
              },
              {
                id: 2,
                name: 'Global Logistics',
                status: 'active',
                riskLevel: 'medium',
                contractValue: '75000',
                industry: 'Logistics',
                relationships: [
                  { vendorId: 1, type: 'subcontractor', strength: 'high' },
                  { vendorId: 4, type: 'supplier', strength: 'low' }
                ]
              },
              {
                id: 3,
                name: 'Risky Ventures',
                status: 'pending',
                riskLevel: 'high',
                contractValue: '25000',
                industry: 'Finance',
                relationships: [
                  { vendorId: 1, type: 'partner', strength: 'medium' }
                ]
              },
              {
                id: 4,
                name: 'Supply Chain Co',
                status: 'active',
                riskLevel: 'low',
                contractValue: '40000',
                industry: 'Manufacturing',
                relationships: [
                  { vendorId: 2, type: 'supplier', strength: 'low' }
                ]
              }
            ]
          }
        })
      });
    });

    await page.goto('/vendor-graph');
  });

  test('should display vendor graph page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vendor Graph');
  });

  test('should display graph visualization', async ({ page }) => {
    // Check that the graph container is visible
    await expect(page.locator('[data-testid="vendor-graph"]')).toBeVisible();
  });

  test('should display graph controls and filters', async ({ page }) => {
    // Check for graph controls
    await expect(page.locator('button:has-text("Zoom In")')).toBeVisible();
    await expect(page.locator('button:has-text("Zoom Out")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset View")')).toBeVisible();
  });

  test('should display vendor nodes in the graph', async ({ page }) => {
    // Check that vendor nodes are rendered
    await expect(page.locator('[data-testid="vendor-node"]')).toHaveCount(4);
    
    // Check that vendor names are visible on nodes
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
    await expect(page.locator('text=Global Logistics')).toBeVisible();
    await expect(page.locator('text=Risky Ventures')).toBeVisible();
    await expect(page.locator('text=Supply Chain Co')).toBeVisible();
  });

  test('should display relationship connections between vendors', async ({ page }) => {
    // Check that relationship lines are rendered
    await expect(page.locator('[data-testid="relationship-line"]')).toHaveCount(4);
  });

  test('should show vendor details when clicking on a node', async ({ page }) => {
    // Click on a vendor node
    await page.click('[data-testid="vendor-node"]').first();
    
    // Check that vendor details panel is shown
    await expect(page.locator('[data-testid="vendor-details-panel"]')).toBeVisible();
    await expect(page.locator('text=Vendor Details')).toBeVisible();
  });

  test('should display vendor information in details panel', async ({ page }) => {
    // Click on first vendor node
    await page.click('[data-testid="vendor-node"]').first();
    
    // Check vendor information
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
    await expect(page.locator('text=Technology')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Low Risk')).toBeVisible();
    await expect(page.locator('text=$50,000')).toBeVisible();
  });

  test('should show relationships in vendor details', async ({ page }) => {
    // Click on first vendor node
    await page.click('[data-testid="vendor-node"]').first();
    
    // Check relationships section
    await expect(page.locator('text=Relationships')).toBeVisible();
    await expect(page.locator('text=Global Logistics')).toBeVisible();
    await expect(page.locator('text=Risky Ventures')).toBeVisible();
  });

  test('should filter vendors by status', async ({ page }) => {
    // Click on status filter
    await page.click('button:has-text("Status")');
    await page.click('text=Active');
    
    // Check that only active vendors are visible
    await expect(page.locator('[data-testid="vendor-node"]')).toHaveCount(3);
    await expect(page.locator('text=Risky Ventures')).not.toBeVisible();
  });

  test('should filter vendors by risk level', async ({ page }) => {
    // Click on risk level filter
    await page.click('button:has-text("Risk Level")');
    await page.click('text=High');
    
    // Check that only high risk vendors are visible
    await expect(page.locator('[data-testid="vendor-node"]')).toHaveCount(1);
    await expect(page.locator('text=Risky Ventures')).toBeVisible();
  });

  test('should filter vendors by industry', async ({ page }) => {
    // Click on industry filter
    await page.click('button:has-text("Industry")');
    await page.click('text=Technology');
    
    // Check that only technology vendors are visible
    await expect(page.locator('[data-testid="vendor-node"]')).toHaveCount(1);
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
  });

  test('should search vendors by name', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="search"]', 'Tech');
    
    // Check that only Tech Solutions Inc is visible
    await expect(page.locator('[data-testid="vendor-node"]')).toHaveCount(1);
    await expect(page.locator('text=Tech Solutions Inc')).toBeVisible();
  });

  test('should zoom in and out of the graph', async ({ page }) => {
    // Get initial zoom level
    const initialZoom = await page.locator('[data-testid="graph-container"]').getAttribute('data-zoom');
    
    // Click zoom in button
    await page.click('button:has-text("Zoom In")');
    
    // Check that zoom level increased
    const zoomedIn = await page.locator('[data-testid="graph-container"]').getAttribute('data-zoom');
    expect(parseFloat(zoomedIn)).toBeGreaterThan(parseFloat(initialZoom));
    
    // Click zoom out button
    await page.click('button:has-text("Zoom Out")');
    
    // Check that zoom level decreased
    const zoomedOut = await page.locator('[data-testid="graph-container"]').getAttribute('data-zoom');
    expect(parseFloat(zoomedOut)).toBeLessThan(parseFloat(zoomedIn));
  });

  test('should reset graph view', async ({ page }) => {
    // Zoom in first
    await page.click('button:has-text("Zoom In")');
    await page.click('button:has-text("Zoom In")');
    
    // Click reset view button
    await page.click('button:has-text("Reset View")');
    
    // Check that view is reset to default
    const resetZoom = await page.locator('[data-testid="graph-container"]').getAttribute('data-zoom');
    expect(parseFloat(resetZoom)).toBe(1);
  });

  test('should display graph legend', async ({ page }) => {
    // Check that legend is visible
    await expect(page.locator('[data-testid="graph-legend"]')).toBeVisible();
    
    // Check legend items
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=High Risk')).toBeVisible();
    await expect(page.locator('text=Medium Risk')).toBeVisible();
    await expect(page.locator('text=Low Risk')).toBeVisible();
  });

  test('should show relationship types in legend', async ({ page }) => {
    // Check relationship type legend
    await expect(page.locator('text=Subcontractor')).toBeVisible();
    await expect(page.locator('text=Partner')).toBeVisible();
    await expect(page.locator('text=Supplier')).toBeVisible();
  });

  test('should handle graph interactions', async ({ page }) => {
    // Test dragging a node
    const node = page.locator('[data-testid="vendor-node"]').first();
    const initialPosition = await node.boundingBox();
    
    // Drag the node
    await node.dragTo(page.locator('[data-testid="graph-container"]'));
    
    // Check that position changed
    const newPosition = await node.boundingBox();
    expect(newPosition.x).not.toBe(initialPosition.x);
    expect(newPosition.y).not.toBe(initialPosition.y);
  });

  test('should display graph statistics', async ({ page }) => {
    // Check statistics panel
    await expect(page.locator('[data-testid="graph-stats"]')).toBeVisible();
    await expect(page.locator('text=Total Vendors: 4')).toBeVisible();
    await expect(page.locator('text=Total Relationships: 4')).toBeVisible();
  });

  test('should export graph data', async ({ page }) => {
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Check that export options are shown
    await expect(page.locator('text=Export as PNG')).toBeVisible();
    await expect(page.locator('text=Export as SVG')).toBeVisible();
    await expect(page.locator('text=Export as JSON')).toBeVisible();
  });

  test('should handle empty graph data', async ({ page }) => {
    // Mock empty vendors response
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

    // Reload page
    await page.reload();
    
    // Check empty state message
    await expect(page.locator('text=No vendors found')).toBeVisible();
    await expect(page.locator('text=Add some vendors to see the graph')).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/vendors**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to load vendor data'
        })
      });
    });

    // Reload page to trigger error
    await page.reload();
    
    // Check error message
    await expect(page.locator('text=Error loading vendor data')).toBeVisible();
    await expect(page.locator('text=Failed to load vendor data')).toBeVisible();
  });

  test('should show loading state while fetching data', async ({ page }) => {
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
    
    // Check that graph page elements are still visible
    await expect(page.locator('h1')).toContainText('Vendor Graph');
    await expect(page.locator('[data-testid="vendor-graph"]')).toBeVisible();
  });

  test('should highlight connected vendors when hovering over a node', async ({ page }) => {
    // Hover over first vendor node
    await page.hover('[data-testid="vendor-node"]').first();
    
    // Check that connected nodes are highlighted
    await expect(page.locator('[data-testid="vendor-node"][data-highlighted="true"]')).toHaveCount(2);
  });

  test('should show relationship details on hover', async ({ page }) => {
    // Hover over a relationship line
    await page.hover('[data-testid="relationship-line"]').first();
    
    // Check that relationship tooltip is shown
    await expect(page.locator('[data-testid="relationship-tooltip"]')).toBeVisible();
    await expect(page.locator('text=Subcontractor')).toBeVisible();
    await expect(page.locator('text=High Strength')).toBeVisible();
  });

  test('should allow filtering by relationship type', async ({ page }) => {
    // Click on relationship type filter
    await page.click('button:has-text("Relationship Type")');
    await page.click('text=Subcontractor');
    
    // Check that only subcontractor relationships are visible
    await expect(page.locator('[data-testid="relationship-line"][data-type="subcontractor"]')).toHaveCount(2);
  });

  test('should display graph in different layouts', async ({ page }) => {
    // Check layout options
    await expect(page.locator('button:has-text("Force Layout")')).toBeVisible();
    await expect(page.locator('button:has-text("Circular Layout")')).toBeVisible();
    await expect(page.locator('button:has-text("Hierarchical Layout")')).toBeVisible();
    
    // Click on circular layout
    await page.click('button:has-text("Circular Layout")');
    
    // Check that layout changed
    await expect(page.locator('[data-testid="graph-container"][data-layout="circular"]')).toBeVisible();
  });
});