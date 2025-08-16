import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { vendorAPI } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  Phone, 
  Mail, 
  Globe,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import VendorForm from '../components/VendorForm';
import VendorDetail from '../components/VendorDetail';
import toast from 'react-hot-toast';

const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch vendors
  const { data: vendorsResponse, isLoading, error } = useQuery(
    ['vendors', searchTerm, statusFilter, riskFilter, sortBy, sortOrder],
    () => vendorAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      riskLevel: riskFilter !== 'all' ? riskFilter : undefined,
      sortBy,
      sortOrder
    }),
    {
      keepPreviousData: true,
    }
  );

  // Extract vendors array from response
  const vendors = vendorsResponse?.vendors || [];

  // Delete vendor mutation
  const deleteVendorMutation = useMutation(
    (id) => vendorAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        toast.success('Vendor deleted successfully');
        setShowDeleteModal(false);
        setSelectedVendor(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete vendor');
      },
    }
  );

  const handleDelete = () => {
    if (selectedVendor) {
      deleteVendorMutation.mutate(selectedVendor._id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'suspended': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage your vendor relationships</p>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vendors</h3>
              <p className="text-gray-500 mb-4">
                {error.response?.data?.error || 'Failed to load vendors. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage your vendor relationships</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Risk Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risk Level
                  </label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input"
                  >
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                    <option value="riskLevel">Risk Level</option>
                    <option value="contractValue">Contract Value</option>
                    <option value="createdAt">Date Added</option>
                  </select>
                </div>
              </div>

              {/* Sort Order */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`px-3 py-1 rounded text-sm ${
                      sortOrder === 'asc'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`px-3 py-1 rounded text-sm ${
                      sortOrder === 'desc'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Descending
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vendors List */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : vendors?.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || riskFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first vendor'}
              </p>
              {!searchTerm && statusFilter === 'all' && riskFilter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                >
                  Add Your First Vendor
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors?.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vendor.industry || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {vendor.email || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {vendor.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                          {getStatusIcon(vendor.status)}
                          <span className="ml-1 capitalize">{vendor.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(vendor.riskLevel)}`}>
                          <span className="capitalize">{vendor.riskLevel || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.contractValue ? formatCurrency(vendor.contractValue) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(vendor.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowViewModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Vendor"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Vendor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVendor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Vendor</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <strong>{selectedVendor.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVendor(null);
                  }}
                  className="btn-secondary"
                  disabled={deleteVendorMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                  disabled={deleteVendorMutation.isLoading}
                >
                  {deleteVendorMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Vendor</h3>
              <VendorForm
                onSuccess={() => {
                  setShowAddModal(false);
                  setSelectedVendor(null);
                }}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Vendor</h3>
              <VendorForm
                vendor={selectedVendor}
                onSuccess={() => {
                  setShowEditModal(false);
                  setSelectedVendor(null);
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedVendor(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Vendor Modal */}
      {showViewModal && selectedVendor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Vendor Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedVendor(null);
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
              <VendorDetail vendor={selectedVendor} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
