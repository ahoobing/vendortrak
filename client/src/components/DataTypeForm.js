import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  X,
  Database,
  CheckCircle,
  Save,
  Loader
} from 'lucide-react';
import { dataTypeAPI } from '../services/api';

const DataTypeForm = ({ isOpen, onClose, dataType, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      classification: 'Other',
      riskLevel: 'Medium',
      complianceRequirements: [],
      retentionPeriod: 0,
      isActive: true
    }
  });

  // Fetch classifications for dropdown
  const { data: classificationsData, isLoading: classificationsLoading, error: classificationsError } = useQuery(
    'classifications',
    dataTypeAPI.getClassifications,
    {
      onSuccess: (data) => {
        console.log('Classifications loaded:', data);
      },
      onError: (error) => {
        console.error('Error loading classifications:', error);
      }
    }
  );

  const classifications = classificationsData?.classifications || [
    'Personal Data',
    'Sensitive Personal Data',
    'Financial Data',
    'Health Data',
    'Business Data',
    'Technical Data',
    'Legal Data',
    'Other'
  ];
  
  console.log('Classifications state:', { classificationsData, classifications, classificationsLoading, classificationsError });

  // Compliance requirements options
  const complianceOptions = [
    'GDPR',
    'CCPA',
    'HIPAA',
    'SOX',
    'PCI-DSS',
    'FERPA',
    'GLBA',
    'Other'
  ];

  // Reset form when dataType prop changes
  useEffect(() => {
    if (dataType) {
      reset({
        name: dataType.name || '',
        description: dataType.description || '',
        classification: dataType.classification || 'Other',
        riskLevel: dataType.riskLevel || 'Medium',
        complianceRequirements: dataType.complianceRequirements || [],
        retentionPeriod: dataType.retentionPeriod || 0,
        isActive: dataType.isActive !== undefined ? dataType.isActive : true
      });
    } else {
      reset({
        name: '',
        description: '',
        classification: 'Other',
        riskLevel: 'Medium',
        complianceRequirements: [],
        retentionPeriod: 0,
        isActive: true
      });
    }
  }, [dataType, reset]);

  // Create/Update mutation
  const mutation = useMutation(
    (data) => {
      if (dataType) {
        return dataTypeAPI.update(dataType._id, data);
      } else {
        return dataTypeAPI.create(data);
      }
    },
    {
      onSuccess: () => {
        toast.success(dataType ? 'Data type updated successfully' : 'Data type created successfully');
        queryClient.invalidateQueries('dataTypes');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to save data type');
      }
    }
  );

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplianceChange = (requirement, checked) => {
    const currentRequirements = watch('complianceRequirements') || [];
    let newRequirements;

    if (checked) {
      newRequirements = [...currentRequirements, requirement];
    } else {
      newRequirements = currentRequirements.filter(req => req !== requirement);
    }

    setValue('complianceRequirements', newRequirements);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {dataType ? 'Edit Data Type' : 'Add New Data Type'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Name is required',
                maxLength: { value: 100, message: 'Name must be less than 100 characters' }
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter data type name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                maxLength: { value: 500, message: 'Description must be less than 500 characters' }
              })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe what this data type represents"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Classification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classification *
            </label>
            <select
              {...register('classification', { required: 'Classification is required' })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.classification ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {classifications.map((classification) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
              ))}
            </select>
            {errors.classification && (
              <p className="mt-1 text-sm text-red-600">{errors.classification.message}</p>
            )}
          </div>

          {/* Risk Level and Retention Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level *
              </label>
              <select
                {...register('riskLevel', { required: 'Risk level is required' })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.riskLevel ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {errors.riskLevel && (
                <p className="mt-1 text-sm text-red-600">{errors.riskLevel.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retention Period (months)
              </label>
              <input
                type="number"
                {...register('retentionPeriod', {
                  min: { value: 0, message: 'Retention period must be non-negative' }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.retentionPeriod ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0 for indefinite"
                min="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter 0 for indefinite retention
              </p>
              {errors.retentionPeriod && (
                <p className="mt-1 text-sm text-red-600">{errors.retentionPeriod.message}</p>
              )}
            </div>
          </div>

          {/* Compliance Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliance Requirements
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {complianceOptions.map((requirement) => (
                <label key={requirement} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={watch('complianceRequirements')?.includes(requirement) || false}
                    onChange={(e) => handleComplianceChange(requirement, e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{requirement}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Inactive data types won't be available for assignment to vendors
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="text-sm text-gray-900">{watch('name') || 'Not specified'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Classification:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassificationColor(watch('classification'))}`}>
                  {watch('classification') || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Risk Level:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(watch('riskLevel'))}`}>
                  {watch('riskLevel') || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  watch('isActive') ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {watch('isActive') ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {dataType ? 'Update' : 'Create'} Data Type
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataTypeForm;
