# VendorTrak - Multi-Tenant Vendor Management System

A comprehensive web application for tracking vendor relationships, contracts, and data processing activities across multiple tenants.

## Features

### 🔐 Authentication & Multi-Tenancy
- **JWT-based authentication** with role-based access control
- **Multi-tenant architecture** with tenant isolation
- **User management** with Admin, Manager, and User roles
- **Secure password validation** with real-time feedback

### 🏢 Vendor Management
- **Complete CRUD operations** for vendor records
- **Advanced search and filtering** by status, risk level, and keywords
- **Sorting capabilities** by name, date, and other fields
- **Bulk operations** for efficient vendor management

### 🤖 **Auto-Fill Vendor Information**
- **Web-based vendor search** to automatically populate vendor details
- **Multiple data sources** integration (demo mode with real API examples)
- **Smart field mapping** with confidence scoring
- **Preview before apply** functionality
- **Real-time validation** and error handling

#### Auto-Fill Features:
- **Search by company name** (e.g., "Microsoft", "Salesforce")
- **Automatic field population** including:
  - Company name, website, and contact information
  - Address details (street, city, state, ZIP, country)
  - Industry classification and company description
  - Primary contact information
- **Confidence scoring** to indicate data reliability
- **Data source attribution** for transparency
- **Fallback to demo data** when external APIs are unavailable

#### Future API Integrations:
The system is designed to integrate with real company data APIs:
- **Clearbit API** - Comprehensive company intelligence
- **Company House API** - UK company registry data
- **OpenCorporates API** - Global company information
- **Crunchbase API** - Startup and company data
- **LinkedIn Company API** - Professional network data

### 📊 Dashboard & Analytics
- **Key metrics overview** with visual charts
- **Vendor performance tracking**
- **Contract value analysis**
- **Risk assessment monitoring**

### 🔒 Security Features
- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **Input validation** with express-validator
- **CORS protection** for cross-origin requests
- **Password hashing** with bcryptjs

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **helmet** for security headers
- **cors** for cross-origin resource sharing

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **React Query** for server state management
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Development Tools
- **Concurrently** for running client and server
- **Nodemon** for server auto-restart
- **ESLint** for code quality
- **Git** for version control

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vendortrak
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod --dbpath ~/mongodb/data/db
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

### First Time Setup

1. **Register a new user** - This will create your first tenant
2. **Login with your credentials**
3. **Start adding vendors** using the auto-fill feature or manual entry

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Vendors
- `GET /api/vendors` - Get all vendors (with filtering/pagination)
- `GET /api/vendors/search` - Search for vendor information online
- `GET /api/vendors/:id` - Get vendor by ID
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Users
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

## Auto-Fill Configuration

### Environment Variables for Real APIs
To enable real company data search, add these to your `.env` file:

```env
# Clearbit API (for company intelligence)
CLEARBIT_API_KEY=your_clearbit_api_key

# Company House API (UK companies)
COMPANY_HOUSE_API_KEY=your_company_house_api_key

# OpenCorporates API (global company data)
OPENCORPORATES_API_KEY=your_opencorporates_api_key
```

### Demo Mode
When no API keys are configured, the system runs in demo mode with realistic mock data for testing and development.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation above

---

**VendorTrak** - Streamlining vendor management for modern businesses 🚀
