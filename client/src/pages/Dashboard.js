import React from 'react';
import { useQuery } from 'react-query';
import { tenantAPI } from '../services/api';
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery('tenantStats', tenantAPI.getStats);
  const { data: activity, isLoading: activityLoading } = useQuery('tenantActivity', tenantAPI.getActivity);

  if (statsLoading || activityLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  const statCards = [
    {
      name: 'Total Vendors',
      value: stats?.stats?.vendors?.total || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Vendors',
      value: stats?.stats?.vendors?.active || 0,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      name: 'Total Users',
      value: stats?.stats?.users?.total || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Active Contracts',
      value: stats?.stats?.contracts?.active || 0,
      icon: FileText,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your vendor management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Vendors</h3>
          </div>
          <div className="card-body">
            {activity?.activity?.recentVendors?.length > 0 ? (
              <div className="space-y-4">
                {activity.activity.recentVendors.map((vendor) => (
                  <div key={vendor._id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-sm text-gray-500">{vendor.vendorType}</p>
                    </div>
                    <span className={`badge ${
                      vendor.status === 'active' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent vendors</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
          </div>
          <div className="card-body">
            {activity?.activity?.recentUsers?.length > 0 ? (
              <div className="space-y-4">
                {activity.activity.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent users</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building2 className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Add Vendor</span>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Add User</span>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">View Contracts</span>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
