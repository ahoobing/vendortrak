import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Plus,
  X,
  Database,
  Trash2,
  Edit,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { vendorAPI, dataTypeAPI } from '../services/api';

const VendorDataTypes = ({ vendorId, isOpen, onClose }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newDataTypeId, setNewDataTypeId] = useState('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  // Fetch vendor data types
  const {
    data: vendorDataTypesResponse,
    isLoading: vendorDataTypesLoading,
    error: vendorDataTypesError
  } = useQuery(
    ['vendorDataTypes', vendorId],
    () => vendorAPI.getDataTypes(vendorId),
    {
      enabled: isOpen && !!vendorId
    }
  );

  // Fetch all available data types
  const {
    data: allDataTypesResponse,
    isLoading: allDataTypesLoading,
    error: allDataTypesError
  } = useQuery(
    ['allDataTypes', 'vendor-assignment'],
    () => {
      console.log('VendorDataTypes - Fetching available data types...');
      return dataTypeAPI.getAvailable();
    },
    {
      enabled: isOpen, // Always fetch when modal is open, not just when add modal is shown
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('VendorDataTypes - Error fetching data types:', error);
        console.error('VendorDataTypes - Error response:', error.response);
        console.error('VendorDataTypes - Error status:', error.response?.status);
        console.error('VendorDataTypes - Error data:', error.response?.data);
      }
    }
  );

  // Add data type mutation
  const addDataTypeMutation = useMutation(
    (data) => vendorAPI.addDataType(vendorId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendorDataTypes', vendorId]);
        toast.success('Data type added successfully');
        setShowAddModal(false);
        setNewDataTypeId('');
        setNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add data type');
      }
    }
  );

  // Update data type mutation
  const updateDataTypeMutation = useMutation(
    ({ dataTypeId, data }) => vendorAPI.updateDataType(vendorId, dataTypeId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendorDataTypes', vendorId]);
        toast.success('Data type updated successfully');
        setShowEditModal(false);
        setSelectedDataType(null);
        setNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update data type');
      }
    }
  );

  // Remove data type mutation
  const removeDataTypeMutation = useMutation(
    (dataTypeId) => vendorAPI.removeDataType(vendorId, dataTypeId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendorDataTypes', vendorId]);
        toast.success('Data type removed successfully');
        setShowDeleteModal(false);
        setSelectedDataType(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to remove data type');
      }
    }
  );

  const vendorDataTypes = vendorDataTypesResponse?.data?.dataTypes || vendorDataTypesResponse?.dataTypes || [];
  const allDataTypes = allDataTypesResponse?.data?.dataTypes || allDataTypesResponse?.dataTypes || [];

  // Debug logging
  console.log('VendorDataTypes - allDataTypesResponse:', allDataTypesResponse);
  console.log('VendorDataTypes - allDataTypes:', allDataTypes);
  console.log('VendorDataTypes - vendorDataTypes:', vendorDataTypes);

  // Filter out already assigned data types
  const availableDataTypes = allDataTypes.filter(
    dataType => !vendorDataTypes.some(vdt => vdt.dataTypeId._id === dataType._id)
  );

  console.log('VendorDataTypes - availableDataTypes:', availableDataTypes);

  const handleAddDataType = () => {
    if (!newDataTypeId) {
      toast.error('Please select a data type');
      return;
    }
    addDataTypeMutation.mutate({
      dataTypeId: newDataTypeId,
      notes: notes.trim()
    });
  };

  const handleUpdateDataType = () => {
    if (!selectedDataType) return;
    updateDataTypeMutation.mutate({
      dataTypeId: selectedDataType.dataTypeId._id,
      data: { notes: notes.trim() }
    });
  };

  const handleRemoveDataType = () => {
    if (!selectedDataType) return;
    removeDataTypeMutation.mutate(selectedDataType.dataTypeId._id);
  };

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Manage Vendor Data Types</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add Data Type Button */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Assigned Data Types</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Data Type
            </button>
          </div>

          {/* Data Types List */}
          {vendorDataTypesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading data types...</p>
            </div>
          ) : vendorDataTypesError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load data types</p>
            </div>
          ) : vendorDataTypes.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data types assigned</h3>
              <p className="text-gray-600">Start by adding data types to this vendor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendorDataTypes.map((assignment) => (
                <div
                  key={assignment.dataTypeId._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {assignment.dataTypeId.name}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassificationColor(assignment.dataTypeId.classification)}`}>
                          {assignment.dataTypeId.classification}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(assignment.dataTypeId.riskLevel)}`}>
                          {assignment.dataTypeId.riskLevel}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{assignment.dataTypeId.description}</p>
                      
                      {assignment.notes && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {assignment.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Assigned: {formatDate(assignment.assignedDate)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          By: {assignment.assignedBy?.firstName} {assignment.assignedBy?.lastName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedDataType(assignment);
                          setNotes(assignment.notes || '');
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit notes"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDataType(assignment);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Remove data type"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Data Type Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Add Data Type</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="dataTypeSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Data Type *
                  </label>
                  <select
                    id="dataTypeSelect"
                    value={newDataTypeId}
                    onChange={(e) => setNewDataTypeId(e.target.value)}
                    disabled={allDataTypesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">
                      {allDataTypesLoading ? 'Loading data types...' : 'Choose a data type...'}
                    </option>
                    {availableDataTypes.length === 0 && !allDataTypesLoading ? (
                      <option value="" disabled>No data types available</option>
                    ) : (
                      availableDataTypes.map((dataType) => (
                        <option key={dataType._id} value={dataType._id}>
                          {dataType.name} ({dataType.classification})
                        </option>
                      ))
                    )}
                  </select>
                  {allDataTypesLoading && (
                    <p className="text-sm text-gray-500 mt-1">Loading available data types...</p>
                  )}
                  {allDataTypesError && (
                    <p className="text-sm text-red-500 mt-1">Failed to load data types. Please try again.</p>
                  )}
                  {availableDataTypes.length === 0 && !allDataTypesLoading && allDataTypes.length > 0 && (
                    <p className="text-sm text-blue-500 mt-1">All data types are already assigned to this vendor.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dataTypeNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="dataTypeNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add any notes about this data type assignment..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddDataType}
                    disabled={addDataTypeMutation.isLoading || !newDataTypeId || availableDataTypes.length === 0}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {addDataTypeMutation.isLoading ? 'Adding...' : 'Add Data Type'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Data Type Modal */}
        {showEditModal && selectedDataType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Edit Data Type Notes</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </span>
                  <p className="text-sm text-gray-900">{selectedDataType.dataTypeId.name}</p>
                </div>

                <div>
                  <label htmlFor="editDataTypeNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="editDataTypeNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add any notes about this data type assignment..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDataType}
                    disabled={updateDataTypeMutation.isLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {updateDataTypeMutation.isLoading ? 'Updating...' : 'Update Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDataType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center mb-4 p-6 border-b">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Remove Data Type</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove "{selectedDataType.dataTypeId.name}" from this vendor? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveDataType}
                    disabled={removeDataTypeMutation.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {removeDataTypeMutation.isLoading ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDataTypes;
