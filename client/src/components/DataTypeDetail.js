import React from 'react';
import {
  X,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Edit
} from 'lucide-react';

const DataTypeDetail = ({ isOpen, onClose, dataType, onEdit }) => {
  if (!isOpen || !dataType) return null;

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

  const formatRetentionPeriod = (months) => {
    if (months === 0) return 'Indefinite';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Data Type Details</h2>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(dataType)}
                className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900">{dataType.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-900">{dataType.category}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{dataType.description}</p>
              </div>
            </div>
          </div>

          {/* Classification and Risk */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Classification & Risk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classification</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getClassificationColor(dataType.classification)}`}>
                  {dataType.classification}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(dataType.riskLevel)}`}>
                  {dataType.riskLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Requirements */}
          {dataType.complianceRequirements && dataType.complianceRequirements.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {dataType.complianceRequirements.map((requirement) => (
                  <span
                    key={requirement}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {requirement}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Retention and Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Retention & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period</label>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {formatRetentionPeriod(dataType.retentionPeriod)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center">
                  {dataType.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-green-600 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-600 font-medium">Inactive</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {dataType.createdBy?.firstName} {dataType.createdBy?.lastName}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {formatDate(dataType.createdAt)}
                  </span>
                </div>
              </div>
              {dataType.updatedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated By</label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {dataType.updatedBy.firstName} {dataType.updatedBy.lastName}
                    </span>
                  </div>
                </div>
              )}
              {dataType.updatedAt && dataType.updatedAt !== dataType.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {formatDate(dataType.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Data Type ID:</span>
                <span className="text-gray-900 font-mono">{dataType._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fields:</span>
                <span className="text-gray-900">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compliance Requirements:</span>
                <span className="text-gray-900">{dataType.complianceRequirements?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTypeDetail;
