# User Management System

## Overview

The VendorTrak application now includes a comprehensive user management system with role-based access control (RBAC) and granular permissions. This system allows administrators to manage user accounts, assign roles, and control access to different features of the application.

## User Roles

### 1. Admin
**Full access to all features**
- ✅ Manage users (create, edit, delete)
- ✅ Manage vendors (create, edit, delete)
- ✅ Manage data types (create, edit, delete)
- ✅ View reports and analytics
- ✅ Export data
- ✅ Access audit logs
- ✅ System administration

### 2. Regular User
**Standard user with vendor management capabilities**
- ❌ Manage users
- ✅ Manage vendors (create, edit, delete)
- ❌ Manage data types
- ✅ View reports and analytics
- ❌ Export data
- ❌ Access audit logs

### 3. Auditor
**Read-only access with data export capabilities**
- ❌ Manage users
- ❌ Manage vendors
- ❌ Manage data types
- ✅ View reports and analytics
- ✅ Export data
- ✅ Access audit logs

## Permission System

The system uses a granular permission system where each user has specific boolean flags for different actions:

```javascript
permissions: {
  canManageUsers: boolean,      // Create, edit, delete users
  canManageVendors: boolean,    // Create, edit, delete vendors
  canManageDataTypes: boolean,  // Create, edit, delete data types
  canViewReports: boolean,      // Access reports and analytics
  canExportData: boolean,       // Export data to various formats
  canAuditLogs: boolean         // Access audit and activity logs
}
```

## Features

### User Management Interface
- **User List**: View all users with filtering and search capabilities
- **User Creation**: Add new users with role assignment
- **User Editing**: Modify user information and roles
- **User Deletion**: Remove users (with safeguards for admins)
- **Status Management**: Activate, deactivate, or suspend users

### Statistics Dashboard
- Total user count
- Active vs. inactive users
- Role distribution
- Quick overview of system usage

### Advanced Filtering
- Search by name or email
- Filter by role (Admin, Regular, Auditor)
- Filter by status (Active, Inactive, Suspended)
- Pagination for large user lists

### Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Role-based middleware protection
- Tenant isolation
- Prevention of last admin deletion

## API Endpoints

### GET /api/users
Retrieve all users with filtering and pagination
- **Required Permission**: `view:reports`
- **Query Parameters**: `page`, `limit`, `role`, `status`, `search`

### GET /api/users/:id
Retrieve specific user details
- **Required Permission**: `view:reports`

### POST /api/users
Create new user
- **Required Permission**: `create:user`
- **Body**: User information including role and permissions

### PUT /api/users/:id
Update existing user
- **Required Permission**: `update:user`
- **Body**: Updated user information

### DELETE /api/users/:id
Delete user
- **Required Permission**: `delete:user`
- **Safeguards**: Cannot delete last admin or own account

### GET /api/users/stats/overview
Get user statistics
- **Required Permission**: `view:reports`

### GET /api/users/:id/permissions
Get user permissions
- **Required Permission**: `view:reports`

## Database Schema

### User Model
```javascript
{
  tenantId: ObjectId,           // Reference to tenant
  email: String,                // Unique email address
  password: String,             // Hashed password
  firstName: String,            // First name
  lastName: String,             // Last name
  role: String,                 // 'admin', 'regular', 'auditor'
  permissions: Object,          // Granular permissions
  status: String,               // 'active', 'inactive', 'suspended'
  profile: Object,              // Additional user information
  lastLogin: Date,              // Last login timestamp
  createdAt: Date,              // Account creation date
  updatedAt: Date               // Last update date
}
```

## Migration

To update existing users to the new role system, run the migration script:

```bash
cd server
npm run migrate:user-roles
```

This script will:
1. Convert existing 'manager' and 'user' roles to 'regular'
2. Set appropriate permissions for all users based on their roles
3. Maintain data integrity during the transition

## Usage Examples

### Creating a New Admin User
```javascript
const newAdmin = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@company.com",
  password: "securepassword123",
  role: "admin",
  status: "active",
  profile: {
    department: "IT",
    position: "System Administrator"
  }
};
```

### Checking User Permissions
```javascript
// Check if user can manage vendors
if (user.hasPermission('canManageVendors')) {
  // Allow vendor management
}

// Check if user can perform specific action
if (user.canPerform('create:vendor')) {
  // Allow vendor creation
}
```

### Role-Based Middleware
```javascript
// Require admin role
app.use('/admin', requireAdmin);

// Require specific permission
app.use('/vendors', requirePermission('create:vendor'));

// Require multiple roles
app.use('/reports', requireRole(['admin', 'auditor']));
```

## Security Considerations

1. **Password Security**: All passwords are hashed using bcrypt with a salt round of 12
2. **JWT Tokens**: Authentication tokens are verified on each request
3. **Tenant Isolation**: Users can only access data within their tenant
4. **Permission Validation**: All actions are validated against user permissions
5. **Admin Protection**: System prevents deletion of the last admin user
6. **Input Validation**: All user inputs are validated and sanitized

## Best Practices

1. **Role Assignment**: Assign the minimum required role for each user
2. **Regular Audits**: Periodically review user roles and permissions
3. **Password Policies**: Enforce strong password requirements
4. **Access Monitoring**: Monitor user access patterns and login attempts
5. **Backup Users**: Always maintain multiple admin users for redundancy

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required role
   - Verify user permissions are correctly set
   - Ensure user account is active

2. **Role Update Issues**
   - Verify the new role is valid
   - Check if user has permission to modify roles
   - Ensure role change doesn't violate system constraints

3. **User Creation Failures**
   - Verify email uniqueness within tenant
   - Check password strength requirements
   - Ensure all required fields are provided

### Debug Commands

```bash
# Check user permissions
curl -H "Authorization: Bearer <token>" /api/users/<user-id>/permissions

# View user statistics
curl -H "Authorization: Bearer <token>" /api/users/stats/overview

# List all users
curl -H "Authorization: Bearer <token>" /api/users
```

## Future Enhancements

1. **Group Management**: Create user groups for easier permission management
2. **Temporary Permissions**: Time-limited elevated permissions
3. **Audit Trail**: Detailed logging of all user management actions
4. **Bulk Operations**: Mass user import/export and role updates
5. **Advanced Permissions**: More granular control over specific features
6. **Integration**: LDAP/AD integration for enterprise environments
