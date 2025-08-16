// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

/**
 * Setup authentication for a Playwright page by performing login
 */
async function setupTestAuth(page) {
  try {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    
    // Fill in test credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Wait for submit button to be enabled
    await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for either successful login redirect or error message
    try {
      // Wait for successful login (redirect to dashboard or vendors page)
      await page.waitForURL(/.*\/(dashboard|vendors).*/, { timeout: 15000 });
    } catch (timeoutError) {
      // Check if there's an error message
      const errorElement = await page.locator('.error, [role="alert"], .toast-error').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      
      // Check current URL to see where we ended up
      const currentUrl = page.url();
      console.log(`Login timeout. Current URL: ${currentUrl}`);
      
      // If we're still on login page, try to get more info
      if (currentUrl.includes('/login')) {
        const pageContent = await page.content();
        console.log('Still on login page after submission');
        throw new Error('Login submission did not redirect');
      }
      
      throw timeoutError;
    }
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
  } catch (error) {
    console.error('Failed to setup test authentication:', error);
    throw error;
  }
}

/**
 * Mock authentication for tests that don't need real API calls
 */
function mockTestAuth(page) {
  return page.addInitScript(() => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin'
    }));
  });
}

module.exports = {
  setupTestAuth,
  mockTestAuth,
  TEST_USER
};
