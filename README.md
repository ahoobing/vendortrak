# VendorTrak - Multi-Tenant Vendor Management System

A comprehensive web application for tracking vendors, contracts, and data types with multi-tenant architecture. Built with Node.js, MongoDB, and React.

## Features

### Multi-Tenant Architecture
- Complete tenant isolation with separate data spaces
- Custom subdomain support for each tenant
- Tenant-specific user management and settings

### Vendor Management
- Comprehensive vendor profiles with contact information
- Contract tracking with start/end dates, values, and status
- Data type classification and sensitivity tracking
- Risk level assessment and compliance monitoring
- Performance reviews and ratings

### User Management
- Role-based access control (Admin, Manager, User)
- Tenant-specific user accounts
- Profile management and password changes

### Dashboard & Analytics
- Real-time statistics and metrics
- Vendor type distribution
- Risk level analysis
- Contract value summaries
- Recent activity tracking

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **helmet** and **cors** for security

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **React Query** for server state management
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vendortrak
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment example
   cd ../server
   cp env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

   Required environment variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/vendortrak
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the application**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend client (port 3000).

## Usage

### First Time Setup

1. Navigate to `http://localhost:3000`
2. Click "Create a new account"
3. Fill in your organization details:
   - Organization name
   - Domain (e.g., example.com)
   - Subdomain (e.g., company)
4. Create your admin user account
5. You'll be automatically logged in and redirected to the dashboard

### Adding Vendors

1. Navigate to the Vendors page
2. Click "Add Vendor"
3. Fill in vendor information:
   - Basic details (name, type, status)
   - Contact information
   - Risk level assessment
4. Add contracts and data types as needed

### Managing Users

1. Navigate to the Users page (Admin only)
2. Click "Add User" to create new accounts
3. Assign appropriate roles and permissions
4. Manage user status and profiles

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new tenant and admin
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Vendors
- `GET /api/vendors` - Get all vendors (with filtering)
- `POST /api/vendors` - Create new vendor
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `POST /api/vendors/:id/contracts` - Add contract
- `POST /api/vendors/:id/data-types` - Add data type
- `POST /api/vendors/:id/reviews` - Add review

### Users
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Tenants
- `GET /api/tenants/current` - Get current tenant info
- `PUT /api/tenants/current` - Update tenant settings
- `GET /api/tenants/stats` - Get tenant statistics

## Database Schema

### Tenant
- Basic tenant information (name, domain, subdomain)
- Settings (user limits, vendor limits, features)
- Contact information

### User
- Authentication details (email, password)
- Profile information (name, role, status)
- Tenant association

### Vendor
- Basic vendor information
- Contact details and persons
- Contracts array
- Data types array
- Compliance and performance tracking

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet security headers

## Development

### Project Structure
```
vendortrak/
├── server/                 # Backend Node.js application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
└── package.json           # Root package.json
```

### Available Scripts

```bash
# Development
npm run dev              # Start both server and client
npm run server           # Start server only
npm run client           # Start client only

# Production
npm run build            # Build client for production
npm start                # Start production server

# Installation
npm run install-all      # Install all dependencies
```

## Deployment

### Backend Deployment
1. Set up a MongoDB instance (Atlas recommended)
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables for API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
