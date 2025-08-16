import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { vendorAPI } from '../services/api';
import { Building2, Phone, Mail, Globe, MapPin, DollarSign, AlertTriangle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const VendorForm = ({ vendor = null, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: vendor ? {
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      website: vendor.website || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zipCode: vendor.zipCode || '',
      country: vendor.country || '',
      industry: vendor.industry || '',
      description: vendor.description || '',
      status: vendor.status || 'active',
      riskLevel: vendor.riskLevel || 'medium',
      contractValue: vendor.contractValue || '',
      contractStartDate: vendor.contractStartDate ? vendor.contractStartDate.split('T')[0] : '',
      contractEndDate: vendor.contractEndDate ? vendor.contractEndDate.split('T')[0] : '',
      primaryContact: vendor.primaryContact || '',
      primaryContactEmail: vendor.primaryContactEmail || '',
      primaryContactPhone: vendor.primaryContactPhone || '',
      notes: vendor.notes || '',
    } : {
      status: 'active',
      riskLevel: 'medium',
    }
  });

  const createVendorMutation = useMutation(
    (data) => vendorAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        toast.success('Vendor created successfully');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create vendor');
      },
    }
  );

  const updateVendorMutation = useMutation(
    (data) => vendorAPI.update(vendor._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        toast.success('Vendor updated successfully');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update vendor');
      },
    }
  );

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      console.log('Current user:', user);
      console.log('Form data before processing:', data);
      
      // Set default values if not provided
      if (!data.status) data.status = 'active';
      if (!data.riskLevel) data.riskLevel = 'medium';
      
      // Format contract value as number
      if (data.contractValue) {
        data.contractValue = parseFloat(data.contractValue.replace(/[^0-9.-]+/g, ''));
      }

      // Remove empty date fields
      if (!data.contractStartDate) delete data.contractStartDate;
      if (!data.contractEndDate) delete data.contractEndDate;

      // Remove empty string fields
      if (!data.email || data.email.trim() === '') delete data.email;
      if (!data.website || data.website.trim() === '') delete data.website;
      if (!data.phone || data.phone.trim() === '') delete data.phone;
      if (!data.address || data.address.trim() === '') delete data.address;
      if (!data.city || data.city.trim() === '') delete data.city;
      if (!data.state || data.state.trim() === '') delete data.state;
      if (!data.zipCode || data.zipCode.trim() === '') delete data.zipCode;
      if (!data.country || data.country.trim() === '') delete data.country;
      if (!data.industry || data.industry.trim() === '') delete data.industry;
      if (!data.description || data.description.trim() === '') delete data.description;
      if (!data.primaryContact || data.primaryContact.trim() === '') delete data.primaryContact;
      if (!data.primaryContactEmail || data.primaryContactEmail.trim() === '') delete data.primaryContactEmail;
      if (!data.primaryContactPhone || data.primaryContactPhone.trim() === '') delete data.primaryContactPhone;
      if (!data.notes || data.notes.trim() === '') delete data.notes;

      console.log('Form data after processing:', data);

      if (vendor) {
        await updateVendorMutation.mutateAsync(data);
      } else {
        await createVendorMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.-]+/g, '');
    if (numericValue === '') return '';
    
    // Format as currency
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const handleCurrencyChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    e.target.value = formatted;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              {...register('name', { required: 'Vendor name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Technology, Healthcare, Manufacturing"
              {...register('industry')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="input"
              placeholder="Brief description of the vendor and their services..."
              {...register('description')}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary-600" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                className="input pl-10"
                placeholder="(555) 123-4567"
                {...register('phone')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                className="input pl-10"
                placeholder="https://www.example.com"
                {...register('website')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Contact Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="John Doe"
              {...register('primaryContact')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Contact Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="john.doe@company.com"
              {...register('primaryContactEmail')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Contact Phone
            </label>
            <input
              type="tel"
              className="input"
              placeholder="(555) 123-4567"
              {...register('primaryContactPhone')}
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          Address Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              className="input"
              placeholder="123 Main Street"
              {...register('address')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              className="input"
              placeholder="New York"
              {...register('city')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <input
              type="text"
              className="input"
              placeholder="NY"
              {...register('state')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              className="input"
              placeholder="10001"
              {...register('zipCode')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              className="input"
              placeholder="United States"
              {...register('country')}
            />
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary-600" />
          Contract Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Value
            </label>
            <input
              type="text"
              className="input"
              placeholder="$0"
              onChange={handleCurrencyChange}
              {...register('contractValue')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Start Date
            </label>
            <input
              type="date"
              className="input"
              {...register('contractStartDate')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract End Date
            </label>
            <input
              type="date"
              className="input"
              {...register('contractEndDate')}
            />
          </div>
        </div>
      </div>

      {/* Status and Risk */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary-600" />
          Status & Risk Assessment
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              className={`input ${errors.status ? 'border-red-500' : ''}`}
              {...register('status', { required: 'Status is required' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Level *
            </label>
            <select
              className={`input ${errors.riskLevel ? 'border-red-500' : ''}`}
              {...register('riskLevel', { required: 'Risk level is required' })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.riskLevel && (
              <p className="mt-1 text-sm text-red-600">{errors.riskLevel.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
        <textarea
          rows={4}
          className="input"
          placeholder="Any additional notes or comments about this vendor..."
          {...register('notes')}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : vendor ? (
            'Update Vendor'
          ) : (
            'Create Vendor'
          )}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;
