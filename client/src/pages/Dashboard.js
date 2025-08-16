import React from 'react';
import { useQuery } from 'react-query';
import { vendorAPI } from '../services/api';
import { 
  Building2, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  // Fetch vendor data for statistics
  const { data: vendorsData, isLoading: vendorsLoading, error: vendorsError } = useQuery('vendors', () => 
    vendorAPI.getAll({ limit: 1000 })
  );
  
  if (vendorsLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (vendorsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your vendor management dashboard</p>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-red-600">Error loading vendors: {vendorsError.message}</p>
            <p className="text-sm text-gray-500 mt-2">Please check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const vendors = vendorsData?.data?.vendors || [];
  
  // Calculate vendor statistics
  const vendorStats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    highRisk: vendors.filter(v => v.riskLevel === 'high').length,
    mediumRisk: vendors.filter(v => v.riskLevel === 'medium').length,
    lowRisk: vendors.filter(v => v.riskLevel === 'low').length,
    totalContractValue: vendors.reduce((sum, v) => sum + (parseFloat(v.contractValue) || 0), 0),
    avgContractValue: vendors.length > 0 ? vendors.reduce((sum, v) => sum + (parseFloat(v.contractValue) || 0), 0) / vendors.length : 0
  };

  // Get recent vendors (last 5 created)
  const recentVendors = vendors
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get vendors by industry
  const industryStats = vendors.reduce((acc, vendor) => {
    const industry = vendor.industry || 'Unknown';
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {});

  const topIndustries = Object.entries(industryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const statCards = [
    {
      name: 'Total Vendors',
      value: vendorStats.total,
      icon: Building2,
      color: 'bg-blue-500',
      description: 'All vendors in system'
    },
    {
      name: 'Active Vendors',
      value: vendorStats.active,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Currently active vendors'
    },
    {
      name: 'Total Contract Value',
      value: `$${vendorStats.totalContractValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      description: 'Sum of all contract values'
    },
    {
      name: 'High Risk Vendors',
      value: vendorStats.highRisk,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Vendors with high risk level'
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return `$${parseFloat(value).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

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
                      <dd className="text-xs text-gray-500">
                        {stat.description}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendor Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Vendors */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Vendors</h3>
          </div>
          <div className="card-body">
            {recentVendors.length > 0 ? (
              <div className="space-y-4">
                {recentVendors.map((vendor) => (
                  <div key={vendor._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-500">{vendor.industry || 'No industry'}</p>
                      <p className="text-xs text-gray-400">{formatDate(vendor.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(vendor.riskLevel)}`}>
                        {vendor.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No vendors found</p>
            )}
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Risk Level Distribution</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">High Risk</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{vendorStats.highRisk}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Medium Risk</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{vendorStats.mediumRisk}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Low Risk</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{vendorStats.lowRisk}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Industries */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Industries</h3>
          </div>
          <div className="card-body">
            {topIndustries.length > 0 ? (
              <div className="space-y-3">
                {topIndustries.map(([industry, count]) => (
                  <div key={industry} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{industry}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No industry data</p>
            )}
          </div>
        </div>
      </div>

      {/* Contract Value Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Contract Value Summary</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(vendorStats.totalContractValue)}
              </p>
              <p className="text-sm text-gray-500">Total Contract Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(vendorStats.avgContractValue)}
              </p>
              <p className="text-sm text-gray-500">Average Contract Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {vendors.filter(v => v.contractValue && parseFloat(v.contractValue) > 0).length}
              </p>
              <p className="text-sm text-gray-500">Vendors with Contracts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {vendorStats.active}
              </p>
              <p className="text-sm text-gray-500">Active Vendors</p>
            </div>
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
            <button 
              onClick={() => window.location.href = '/vendors?action=add'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Add Vendor</span>
            </button>
            <button 
              onClick={() => window.location.href = '/vendors'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">View All Vendors</span>
            </button>
            <button 
              onClick={() => window.location.href = '/vendors?filter=high-risk'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AlertTriangle className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">High Risk Vendors</span>
            </button>
            <button 
              onClick={() => window.location.href = '/vendors?filter=expiring'}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Clock className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Expiring Contracts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
