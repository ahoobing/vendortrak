import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Database,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { dataTypeAPI } from '../services/api';
import DataTypeForm from '../components/DataTypeForm';
import DataTypeDetail from '../components/DataTypeDetail';
import LoadingSpinner from '../components/LoadingSpinner';

const DataTypes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch data types with filters
  const {
    data: dataTypesResponse,
    isLoading,
    error
  } = useQuery(
    ['dataTypes', searchTerm, classificationFilter, riskFilter, statusFilter, sortBy, sortOrder],
    () => {
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (classificationFilter) params.classification = classificationFilter;
      if (riskFilter) params.riskLevel = riskFilter;
      if (statusFilter) params.isActive = statusFilter;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      
      console.log('Fetching data types with params:', params);
      return dataTypeAPI.getAll(params);
    },
    {
      onSuccess: (data) => {
        console.log('Data types fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching data types:', error);
      }
    }
  );

  // Fetch classifications for filter dropdown
  const { data: classificationsData } = useQuery(
    'classifications',
    dataTypeAPI.getClassifications
  );



  // Delete mutation
  const deleteMutation = useMutation(
    (id) => dataTypeAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['dataTypes']);
        toast.success('Data type deleted successfully');
        setShowDeleteModal(false);
        setSelectedDataType(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete data type');
      }
    }
  );

  const dataTypes = dataTypesResponse?.data?.dataTypes || dataTypesResponse?.dataTypes || [];
  const classifications = classificationsData?.data?.classifications || classificationsData?.classifications || [];

  // Debug logging
  console.log('DataTypes component state:', {
    dataTypesResponse,
    dataTypes,
    isLoading,
    error,
    dataTypesLength: dataTypes.length,
    dataTypesResponseKeys: dataTypesResponse ? Object.keys(dataTypesResponse) : null,
    dataTypesResponseType: typeof dataTypesResponse,
    dataTypesResponseData: dataTypesResponse?.data
  });

  // Helper functions
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'Personal Data': return 'text-blue-600 bg-blue-100';
      case 'Sensitive Personal Data': return 'text-red-600 bg-red-100';
      case 'Financial Data': return 'text-green-600 bg-green-100';
      case 'Health Data': return 'text-purple-600 bg-purple-100';
      case 'Business Data': return 'text-indigo-600 bg-indigo-100';
      case 'Technical Data': return 'text-gray-600 bg-gray-100';
      case 'Legal Data': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (isActive) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  const handleDelete = () => {
    if (selectedDataType) {
      deleteMutation.mutate(selectedDataType._id);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setClassificationFilter('');
    setRiskFilter('');
    setStatusFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data Types</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Types</h1>
          <p className="text-gray-600 mt-1">Manage data types and their classifications</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Data Type
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search data types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>

          {/* Clear Filters */}
          {(searchTerm || classificationFilter || riskFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <X className="h-5 w-5 mr-2" />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Classification Filter */}
            <div>
              <label htmlFor="classificationFilter" className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
              <select
                id="classificationFilter"
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Classifications</option>
                {classifications.map((classification) => (
                  <option key={classification} value={classification}>
                    {classification}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label htmlFor="riskFilter" className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                id="riskFilter"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Risk Levels</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>



            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Data Types Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {console.log('Rendering dataTypes:', dataTypes)}
              {dataTypes.map((dataType) => (
                <tr key={dataType._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dataType.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{dataType.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassificationColor(dataType.classification)}`}>
                      {dataType.classification}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(dataType.riskLevel)}`}>
                      {dataType.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(dataType.isActive)}
                      <span className="ml-2 text-sm text-gray-900">
                        {dataType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(dataType.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDataType(dataType);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDataType(dataType);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDataType(dataType);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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

        {/* Empty State */}
        {dataTypes.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data types found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || classificationFilter || riskFilter || statusFilter
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first data type.'}
            </p>
            {!searchTerm && !classificationFilter && !riskFilter && !statusFilter && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Data Type
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {(dataTypesResponse?.data?.pagination || dataTypesResponse?.pagination) && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          {(() => {
            const pagination = dataTypesResponse?.data?.pagination || dataTypesResponse?.pagination;
            return `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} results`;
          })()}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <DataTypeForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries(['dataTypes']);
          }}
        />
      )}

      {showEditModal && selectedDataType && (
        <DataTypeForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          dataType={selectedDataType}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedDataType(null);
            queryClient.invalidateQueries(['dataTypes']);
          }}
        />
      )}

      {showViewModal && selectedDataType && (
        <DataTypeDetail
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          dataType={selectedDataType}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDataType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Data Type</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedDataType.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTypes;
