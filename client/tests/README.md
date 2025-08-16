# Playwright UI Tests for VendorTrak

This directory contains comprehensive automated UI tests for the VendorTrak application using Playwright.

## Overview

The test suite covers all major functionality of the application including:

- **Authentication** - Login, registration, and protected routes
- **Dashboard** - Statistics, charts, and navigation
- **Vendors** - CRUD operations, filtering, searching, and pagination
- **Vendor Graph** - Graph visualization, interactions, and data display
- **Data Types** - Data type management and validation
- **Accessibility** - WCAG compliance and usability testing

## Test Structure

```
tests/
├── auth.spec.js           # Authentication tests
├── dashboard.spec.js      # Dashboard functionality tests
├── vendors.spec.js        # Vendor management tests
├── vendor-graph.spec.js   # Graph visualization tests
├── data-types.spec.js     # Data type management tests
├── accessibility.spec.js  # Accessibility and usability tests
├── utils/
│   └── test-helpers.js    # Common test utilities
└── README.md             # This file
```

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Playwright browsers installed

## Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Verify setup**:
   ```bash
   npx playwright test --help
   ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test auth.spec.js
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in mobile viewport
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests with specific grep pattern
```bash
npx playwright test -g "login"
```

## Test Configuration

The tests are configured in `playwright.config.js` with the following features:

- **Multiple browsers**: Chrome, Firefox, Safari, and mobile browsers
- **Parallel execution**: Tests run in parallel for faster execution
- **Retry logic**: Failed tests are retried on CI
- **Screenshots**: Screenshots are taken on failure
- **Video recording**: Videos are recorded for failed tests
- **Trace collection**: Traces are collected for debugging
- **Web server**: Development server is started automatically

## Test Categories

### Authentication Tests (`auth.spec.js`)

Tests for login, registration, and authentication flow:

- ✅ Login form validation
- ✅ Password visibility toggle
- ✅ Error handling and display
- ✅ Registration form validation
- ✅ Protected route redirection
- ✅ Loading states
- ✅ Form accessibility

### Dashboard Tests (`dashboard.spec.js`)

Tests for the main dashboard functionality:

- ✅ Statistics display
- ✅ Chart rendering
- ✅ Navigation between sections
- ✅ Data loading and error states
- ✅ Responsive design
- ✅ Real-time data updates

### Vendor Management Tests (`vendors.spec.js`)

Tests for vendor CRUD operations:

- ✅ Vendor listing and pagination
- ✅ Search and filtering
- ✅ Add new vendor
- ✅ Edit existing vendor
- ✅ Delete vendor with confirmation
- ✅ Form validation
- ✅ Data table interactions

### Vendor Graph Tests (`vendor-graph.spec.js`)

Tests for graph visualization:

- ✅ Graph rendering
- ✅ Node interactions
- ✅ Relationship display
- ✅ Zoom and pan controls
- ✅ Filtering by various criteria
- ✅ Export functionality
- ✅ Graph layouts

### Data Types Tests (`data-types.spec.js`)

Tests for data type management:

- ✅ Data type listing
- ✅ Add new data type
- ✅ Edit data type
- ✅ Validation rules
- ✅ Category management
- ✅ Form field validation

### Accessibility Tests (`accessibility.spec.js`)

Tests for accessibility compliance:

- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast
- ✅ ARIA attributes
- ✅ Semantic HTML
- ✅ Focus management

## Test Utilities

The `utils/test-helpers.js` file contains common utility functions:

- **Authentication mocking**: `mockAuth()`, `mockLoginAPI()`
- **API mocking**: `mockAPI()`, `mockVendorsAPI()`, `mockAPIError()`
- **Form helpers**: `fillLoginForm()`, `submitLoginForm()`
- **Viewport helpers**: `setMobileViewport()`, `setDesktopViewport()`
- **Assertion helpers**: `expectElementToBeVisible()`, `expectElementToContainText()`
- **Data generators**: `generateRandomEmail()`, `generateRandomVendor()`

## Mocking Strategy

Tests use comprehensive API mocking to ensure:

- **Consistent test data**: Predictable test results
- **Fast execution**: No network dependencies
- **Isolated tests**: Tests don't affect each other
- **Error scenarios**: Easy to test error conditions
- **Edge cases**: Test various data states

## Best Practices

### Test Organization
- Group related tests using `test.describe()`
- Use descriptive test names
- Keep tests independent and isolated
- Use `beforeEach()` for common setup

### Selectors
- Prefer data-testid attributes for stable selectors
- Use semantic selectors when possible
- Avoid CSS classes that might change
- Use text content for user-facing elements

### Assertions
- Test user behavior, not implementation details
- Use meaningful assertions
- Test both positive and negative cases
- Verify error states and edge cases

### Performance
- Mock external dependencies
- Use efficient selectors
- Minimize page reloads
- Reuse setup when possible

## Debugging Tests

### View Test Results
```bash
npx playwright show-report
```

### Debug Failed Tests
```bash
npx playwright test --debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos
- Screenshots are saved in `test-results/`
- Videos are saved for failed tests
- Use `--screenshot=on` for all screenshots

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables
- `CI=true`: Enables CI mode with retries and parallel execution
- `PLAYWRIGHT_BROWSERS_PATH`: Custom browser installation path
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`: Skip browser download

## Troubleshooting

### Common Issues

1. **Browser not found**: Run `npx playwright install`
2. **Tests failing on CI**: Check browser dependencies
3. **Slow tests**: Use `--workers=1` for debugging
4. **Flaky tests**: Add retries and better waits

### Performance Tips

- Use `page.waitForLoadState()` instead of arbitrary delays
- Mock heavy API calls
- Use efficient selectors
- Run tests in parallel when possible

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the test utilities when possible
3. Add appropriate mocking
4. Include both positive and negative test cases
5. Test accessibility features
6. Add tests for error scenarios
7. Update this README if needed

## Test Data

Test data is defined in the mock functions and includes:

- Sample vendors with various statuses and risk levels
- User accounts for authentication testing
- Data types with different categories and formats
- Graph relationships between vendors

## Coverage

The test suite aims to cover:

- ✅ All user-facing functionality
- ✅ Error handling and edge cases
- ✅ Accessibility requirements
- ✅ Responsive design
- ✅ Cross-browser compatibility
- ✅ Performance considerations

## Maintenance

Regular maintenance tasks:

- Update test data as application evolves
- Review and update selectors when UI changes
- Add tests for new features
- Remove obsolete tests
- Update dependencies
- Review test performance