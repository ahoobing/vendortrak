# Testing Documentation

## Overview

This application includes a comprehensive testing setup with both server-side unit tests and client-side end-to-end tests. The testing system includes a dedicated test user account for authenticating E2E tests.

## Test User Account

A dedicated test user is created for running end-to-end tests:

- **Email**: `test@example.com`
- **Password**: `testpassword123`
- **Role**: `admin`
- **Tenant**: `Test Tenant`

## Setup

### 1. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

### 2. Create Test User

```bash
# Create the test user account in the database
npm run test:setup
```

### 3. Start the Application

```bash
# Start both server and client in development mode
npm run dev
```

## Running Tests

### Server Tests (Jest)

```bash
# Run all server tests
cd server && npm test

# Run tests in watch mode
cd server && npm run test:watch

# Run tests with coverage
cd server && npm run test:coverage
```

### Client Tests

#### Unit Tests (Jest)

```bash
# Run React unit tests
cd client && npm test
```

#### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run a single test
npm run test:e2e:single "test name"

# Run tests in UI mode (interactive)
cd client && npm run test:e2e:ui

# Run tests in headed mode (see browser)
cd client && npm run test:e2e:headed

# Run tests in debug mode
cd client && npm run test:e2e:debug

# Show test report
cd client && npm run test:e2e:report
```

## Test Authentication

The E2E tests use real authentication through the UI. The authentication helper (`client/tests/helpers/auth-helper.js`) provides:

- `setupTestAuth(page)` - Performs real login through the UI
- `mockTestAuth(page)` - Sets up mock authentication for tests that don't need real API calls

### Example Usage in Tests

```javascript
const { setupTestAuth } = require('./helpers/auth-helper');

test('should access protected page', async ({ page }) => {
  // Setup authentication (logs in and navigates to dashboard/vendors)
  await setupTestAuth(page);
  
  // Navigate to specific page if needed
  await page.goto('/vendors');
  
  // Test assertions
  await expect(page.locator('h1').filter({ hasText: 'Vendors' })).toBeVisible();
});
```

## Test Structure

### Server Tests
- **Location**: `server/tests/`
- **Framework**: Jest
- **Coverage**: Unit tests for API routes, models, and middleware

### Client Tests
- **Unit Tests**: `client/src/` (Jest)
- **E2E Tests**: `client/tests/` (Playwright)
- **Test Helpers**: `client/tests/helpers/`

### E2E Test Files
- `auth.spec.js` - Authentication tests
- `vendors.spec.js` - Vendor management tests
- `data-types.spec.js` - Data type management tests
- `vendor-graph.spec.js` - Vendor relationship graph tests
- `dashboard.spec.js` - Dashboard functionality tests
- `accessibility.spec.js` - Accessibility compliance tests

## Troubleshooting

### Test User Issues

If tests fail with authentication errors:

1. **Recreate test user**:
   ```bash
   cd server && npm run seed:test-user
   ```

2. **Check database connection**:
   ```bash
   # Ensure MongoDB is running
   mongosh vendortrak --eval "db.users.findOne({email: 'test@example.com'})"
   ```

3. **Verify server is running**:
   ```bash
   curl http://localhost:5001/api/auth/profile
   ```

### Common Issues

1. **"localStorage is not defined"** - Tests are trying to access browser APIs in Node.js context
2. **"Timeout waiting for navigation"** - Server not running or test user not created
3. **"Multiple h1 elements"** - Use `.filter({ hasText: 'text' })` for specific element selection

## Best Practices

1. **Always run `npm run test:setup`** before running E2E tests
2. **Use specific selectors** to avoid conflicts with multiple elements
3. **Wait for page loads** using `page.waitForLoadState('networkidle')`
4. **Handle authentication** in test setup, not individual test cases
5. **Use real authentication** for integration tests, mock for unit tests

## Continuous Integration

The test setup is designed to work in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Setup test user
  run: npm run test:setup
  
- name: Run tests
  run: npm run test:e2e
```

## Package.json Scripts Reference

### Root Level
- `npm run test:setup` - Create test user
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:single` - Run single E2E test

### Server Level
- `npm run seed:test-user` - Create test user
- `npm test` - Run server tests
- `npm run test:coverage` - Run tests with coverage

### Client Level
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests in UI mode
- `npm run test:e2e:headed` - Run tests in headed mode
- `npm run test:e2e:debug` - Run tests in debug mode
