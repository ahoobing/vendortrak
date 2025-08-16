/**
 * Test utility functions for Playwright tests
 */

/**
 * Mock authentication for tests
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} user - User object to mock
 */
export async function mockAuth(page, user = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User'
}) {
  await page.addInitScript((userData) => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(userData));
  }, user);
}

/**
 * Mock API response
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {Object} response - Response object
 */
export async function mockAPI(page, urlPattern, response) {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body)
    });
  });
}

/**
 * Mock vendors API with sample data
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Array} vendors - Array of vendor objects
 */
export async function mockVendorsAPI(page, vendors = []) {
  const defaultVendors = [
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
  ];

  await mockAPI(page, '**/api/vendors**', {
    status: 200,
    body: {
      success: true,
      data: {
        vendors: vendors.length > 0 ? vendors : defaultVendors,
        total: vendors.length > 0 ? vendors.length : defaultVendors.length,
        page: 1,
        limit: 10
      }
    }
  });
}

/**
 * Mock login API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {boolean} success - Whether login should succeed
 * @param {string} error - Error message if login fails
 */
export async function mockLoginAPI(page, success = true, error = 'Invalid credentials') {
  await mockAPI(page, '**/api/auth/login', {
    status: success ? 200 : 401,
    body: success ? {
      success: true,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      },
      token: 'mock-jwt-token'
    } : {
      success: false,
      error: error
    }
  });
}

/**
 * Mock slow API response
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {Object} response - Response object
 * @param {number} delay - Delay in milliseconds
 */
export async function mockSlowAPI(page, urlPattern, response, delay = 2000) {
  await page.route(urlPattern, async route => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body)
    });
  });
}

/**
 * Mock API error
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {string} error - Error message
 * @param {number} status - HTTP status code
 */
export async function mockAPIError(page, urlPattern, error = 'Internal server error', status = 500) {
  await mockAPI(page, urlPattern, {
    status: status,
    body: {
      success: false,
      error: error
    }
  });
}

/**
 * Wait for loading spinner to disappear
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForLoadingToComplete(page) {
  await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 });
}

/**
 * Wait for loading spinner to appear
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForLoadingToStart(page) {
  await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'visible', timeout: 5000 });
}

/**
 * Fill login form
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - Email address
 * @param {string} password - Password
 */
export async function fillLoginForm(page, email = 'test@example.com', password = 'password123') {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
}

/**
 * Submit login form
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function submitLoginForm(page) {
  await page.click('button[type="submit"]');
}

/**
 * Login user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - Email address
 * @param {string} password - Password
 */
export async function loginUser(page, email = 'test@example.com', password = 'password123') {
  await mockLoginAPI(page, true);
  await page.goto('/login');
  await fillLoginForm(page, email, password);
  await submitLoginForm(page);
  await page.waitForURL('/dashboard');
}

/**
 * Check if element is visible and contains text
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {string} text - Expected text
 */
export async function expectElementToContainText(page, selector, text) {
  await expect(page.locator(selector)).toContainText(text);
}

/**
 * Check if element is visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 */
export async function expectElementToBeVisible(page, selector) {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Check if element is not visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 */
export async function expectElementToNotBeVisible(page, selector) {
  await expect(page.locator(selector)).not.toBeVisible();
}

/**
 * Check if element has specific count
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} count - Expected count
 */
export async function expectElementToHaveCount(page, selector, count) {
  await expect(page.locator(selector)).toHaveCount(count);
}

/**
 * Set mobile viewport
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function setMobileViewport(page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * Set tablet viewport
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function setTabletViewport(page) {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * Set desktop viewport
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function setDesktopViewport(page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

/**
 * Generate random email
 * @returns {string} Random email address
 */
export function generateRandomEmail() {
  const timestamp = Date.now();
  return `test${timestamp}@example.com`;
}

/**
 * Generate random vendor data
 * @returns {Object} Random vendor object
 */
export function generateRandomVendor() {
  const id = Math.floor(Math.random() * 1000);
  const timestamp = Date.now();
  
  return {
    id: id,
    name: `Test Vendor ${timestamp}`,
    email: `vendor${timestamp}@example.com`,
    phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    contractValue: String(Math.floor(Math.random() * 100000) + 10000),
    industry: ['Technology', 'Logistics', 'Finance', 'Manufacturing'][Math.floor(Math.random() * 4)],
    address: `${Math.floor(Math.random() * 9999)} Test Street, City, State`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}