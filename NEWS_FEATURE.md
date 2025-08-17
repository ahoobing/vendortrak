# Vendor News & Security Feature

## Overview

The Vendor News & Security page provides a comprehensive view of vendor-related news and security issues in the industry. This feature helps organizations stay informed about potential security risks and vendor-related developments.

## Features

### 1. Vendor News Section
- Displays news specific to vendors in your organization
- Shows vendor tags for easy identification
- Includes security updates, service announcements, and contract renewals
- Color-coded severity indicators (Critical, High, Medium, Low)

### 2. Industry Security Section
- Displays industry-wide security news and alerts
- Focuses on cybersecurity threats, data breaches, and compliance updates
- Provides context for vendor risk assessment

### 3. Search and Filtering
- Search functionality to find specific news items
- Filter options:
  - All News
  - Security Issues
  - Vendor Specific

### 4. Security Severity Indicators
- **Critical**: Red indicators for immediate attention required
- **High**: Orange indicators for high-priority issues
- **Medium**: Yellow indicators for moderate concerns
- **Low**: Green indicators for informational items

## API Endpoints

### GET /api/news/vendors
Returns vendor-specific news with optional filtering and pagination.

**Query Parameters:**
- `limit`: Number of items per page (default: 20)
- `offset`: Pagination offset (default: 0)
- `vendorId`: Filter by specific vendor
- `category`: Filter by category (e.g., 'security')

### GET /api/news/industry
Returns industry security news with pagination.

**Query Parameters:**
- `limit`: Number of items per page (default: 10)
- `offset`: Pagination offset (default: 0)

### GET /api/news/security-alerts
Returns security alerts with severity filtering.

**Query Parameters:**
- `limit`: Number of items per page (default: 10)
- `offset`: Pagination offset (default: 0)
- `severity`: Filter by severity level

### GET /api/news/vendors/:vendorId
Returns news specific to a particular vendor.

### GET /api/news/stats
Returns news statistics and metrics.

## Implementation Details

### Frontend Components
- **News.js**: Main news page component
- **API Integration**: Uses `newsAPI` service for data fetching
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Shows loading spinners during data fetch
- **Error Handling**: Graceful error display for API failures

### Backend Implementation
- **news.js Routes**: Express router handling all news endpoints
- **Mock Data**: Currently uses mock data for demonstration
- **Authentication**: All endpoints require valid JWT token
- **Pagination**: Supports pagination for large datasets
- **Filtering**: Supports various filter options

### Data Structure

#### News Item
```javascript
{
  id: string,
  title: string,
  summary: string,
  publishedAt: string (ISO date),
  url: string,
  category: 'security' | 'general' | 'maintenance',
  severity: 'critical' | 'high' | 'medium' | 'low',
  vendorId?: string,
  vendorName?: string,
  source: string
}
```

#### Security Alert
```javascript
{
  id: string,
  title: string,
  summary: string,
  publishedAt: string (ISO date),
  url: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  affectedVendors: string[],
  recommendedAction: string,
  source: string
}
```

## Future Enhancements

### Real Data Integration
- Integrate with news APIs (e.g., RSS feeds, news services)
- Web scraping for vendor-specific news
- Security feed integration (e.g., CVE databases, threat intelligence)

### Advanced Features
- Email notifications for critical security alerts
- Customizable news preferences
- News archiving and search
- Integration with vendor risk assessment
- Automated risk scoring based on news content

### Analytics
- News engagement metrics
- Security trend analysis
- Vendor risk correlation with news events

## Testing

### Frontend Tests
- Component rendering tests
- User interaction tests
- Responsive design tests
- Error handling tests

### Backend Tests
- API endpoint tests
- Authentication tests
- Data filtering tests
- Pagination tests

## Security Considerations

- All endpoints require authentication
- Input validation for search and filter parameters
- Rate limiting for API endpoints
- Secure handling of external URLs
- Data sanitization for user inputs

## Usage

1. Navigate to the News page from the main navigation
2. Use the search bar to find specific news items
3. Use the filter dropdown to focus on specific news types
4. Click on news items to read more (opens in new tab)
5. Monitor security severity indicators for risk assessment

## Configuration

The news feature can be configured through environment variables:

- `NEWS_API_KEY`: API key for external news services
- `NEWS_UPDATE_INTERVAL`: How often to fetch new news (in minutes)
- `NEWS_RETENTION_DAYS`: How long to keep news items (in days)
