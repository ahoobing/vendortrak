const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const migrateUserRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak');
    console.log('Connected to MongoDB');

    // Update existing users with 'manager' role to 'regular' role
    const managerUpdateResult = await User.updateMany(
      { role: 'manager' },
      { role: 'regular' }
    );
    console.log(`Updated ${managerUpdateResult.modifiedCount} users from 'manager' to 'regular' role`);

    // Update existing users with 'user' role to 'regular' role
    const userUpdateResult = await User.updateMany(
      { role: 'user' },
      { role: 'regular' }
    );
    console.log(`Updated ${userUpdateResult.modifiedCount} users from 'user' to 'regular' role`);

    // Update all users to set permissions based on their current role
    const users = await User.find({});
    let updatedCount = 0;

    for (const user of users) {
      let permissions = {};
      
      switch (user.role) {
        case 'admin':
          permissions = {
            canManageUsers: true,
            canManageVendors: true,
            canManageDataTypes: true,
            canViewReports: true,
            canExportData: true,
            canAuditLogs: true
          };
          break;
        case 'regular':
          permissions = {
            canManageUsers: false,
            canManageVendors: true,
            canManageDataTypes: false,
            canViewReports: true,
            canExportData: false,
            canAuditLogs: false
          };
          break;
        case 'auditor':
          permissions = {
            canManageUsers: false,
            canManageVendors: false,
            canManageDataTypes: false,
            canViewReports: true,
            canExportData: true,
            canAuditLogs: true
          };
          break;
      }

      await User.findByIdAndUpdate(user._id, { permissions });
      updatedCount++;
    }

    console.log(`Updated permissions for ${updatedCount} users`);

    // Verify the migration
    const adminCount = await User.countDocuments({ role: 'admin' });
    const regularCount = await User.countDocuments({ role: 'regular' });
    const auditorCount = await User.countDocuments({ role: 'auditor' });

    console.log('\nMigration completed successfully!');
    console.log('Current user distribution:');
    console.log(`- Admin users: ${adminCount}`);
    console.log(`- Regular users: ${regularCount}`);
    console.log(`- Auditor users: ${auditorCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUserRoles();
}

module.exports = migrateUserRoles;
