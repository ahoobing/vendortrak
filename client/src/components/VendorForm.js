import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { vendorAPI } from '../services/api';
import vendorSearchService from '../services/vendorSearch';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

import { Search, Globe, Building2, Mail, MapPin, Calendar, DollarSign, User, FileText, AlertCircle } from 'lucide-react';

const VendorForm = ({ vendor = null, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: vendor || {
      status: 'active',
      riskLevel: 'medium',
      isSubprocessor: false,
    },
  });

  // Watch form values for autofill
  const watchedValues = watch();
  const watchedName = watch('name');

  // Debounced auto-search when name field changes
  const debouncedAutoSearch = useCallback(
    debounce(async (nameValue) => {
      if (nameValue && nameValue.length > 2 && autoSearchEnabled && !vendor) {
        try {
          setSearchTerm(nameValue);
          const validatedQuery = vendorSearchService.validateQuery(nameValue);
          
          setIsSearching(true);
          const data = await vendorSearchService.searchVendors(validatedQuery);
          setSearchResults(data.results || []);
          setShowSearchResults(true);
          
          if (data.results && data.results.length > 0) {
            toast.success(`🔍 Found ${data.results.length} potential matches for "${nameValue}"`);
          }
        } catch (error) {
          console.error('Auto-search error:', error);
          // Silent fail for auto-search
        } finally {
          setIsSearching(false);
        }
      }
    }, 1000),
    [autoSearchEnabled, vendor]
  );

  // Effect to trigger auto-search when name changes
  useEffect(() => {
    if (watchedName && watchedName !== searchTerm) {
      debouncedAutoSearch(watchedName);
    }
  }, [watchedName, debouncedAutoSearch, searchTerm]);

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const createVendorMutation = useMutation(
    (data) => vendorAPI.create(data),
    {
      onSuccess: (response) => {
        queryClient.refetchQueries('vendors');
        toast.success('Vendor created successfully');
        onSuccess?.();
      },
      onError: (error) => {
        console.error('Vendor creation error:', error);
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

  // Search for vendor information
  const searchVendor = async () => {
    try {
      const validatedQuery = vendorSearchService.validateQuery(searchTerm);
      
      setIsSearching(true);
      setShowSearchResults(false);
      setSearchResults([]);

      const data = await vendorSearchService.searchVendors(validatedQuery);
      setSearchResults(data.results || []);
      setShowSearchResults(true);
      
      if (data.results && data.results.length > 0) {
        toast.success(`Found ${data.results.length} potential matches`);
      } else {
        toast('No matches found. You can still fill in the details manually.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message || 'Search failed. Please try again.');
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };


  // Apply search result to form
  const applySearchResult = (result) => {
    const fieldsToFill = [];
    
    if (result.name) {
      setValue('name', result.name);
      fieldsToFill.push('Name');
    }
    if (result.website) {
      setValue('website', result.website);
      fieldsToFill.push('Website');
    }
    if (result.email) {
      setValue('email', result.email);
      fieldsToFill.push('Email');
    }
    if (result.phone) {
      setValue('phone', result.phone);
      fieldsToFill.push('Phone');
    }
    if (result.address) {
      setValue('address', result.address);
      fieldsToFill.push('Address');
    }
    if (result.city) {
      setValue('city', result.city);
      fieldsToFill.push('City');
    }
    if (result.state) {
      setValue('state', result.state);
      fieldsToFill.push('State');
    }
    if (result.zipCode) {
      setValue('zipCode', result.zipCode);
      fieldsToFill.push('ZIP Code');
    }
    if (result.country) {
      setValue('country', result.country);
      fieldsToFill.push('Country');
    }
    if (result.industry) {
      setValue('industry', result.industry);
      fieldsToFill.push('Industry');
    }
    if (result.description) {
      setValue('description', result.description);
      fieldsToFill.push('Description');
    }
    if (result.primaryContact) {
      setValue('primaryContact', result.primaryContact);
      fieldsToFill.push('Primary Contact');
    }
    if (result.primaryContactEmail) {
      setValue('primaryContactEmail', result.primaryContactEmail);
      fieldsToFill.push('Contact Email');
    }
    if (result.primaryContactPhone) {
      setValue('primaryContactPhone', result.primaryContactPhone);
      fieldsToFill.push('Contact Phone');
    }
    
    setShowSearchResults(false);
    toast.success(`Auto-filled ${fieldsToFill.length} fields: ${fieldsToFill.join(', ')}`);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Set default values if not provided
      if (!data.status) data.status = 'active';
      if (!data.riskLevel) data.riskLevel = 'medium';
      if (data.isSubprocessor === undefined) data.isSubprocessor = false;
      
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

      if (vendor && vendor._id) {
        await updateVendorMutation.mutateAsync(data);
      } else {
        await createVendorMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value.replace(/[^0-9.-]+/g, '');
    setValue('contractValue', value);
  };

  return (
    <div className="space-y-6">
      {/* Autofill Search Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-blue-900">🔍 Auto-fill Vendor Information</h3>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          Search the web for vendor information to automatically populate form fields. This saves time and ensures accuracy.
        </p>
        <div className="bg-white rounded-lg p-3 mb-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600">
              <strong>💡 Pro Tip:</strong> Try searching for company names, websites, or domains (e.g., "Microsoft", "salesforce.com", "HubSpot")
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSearchToggle"
                checked={autoSearchEnabled}
                onChange={(e) => setAutoSearchEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoSearchToggle" className="text-xs text-gray-600">
                Auto-search as you type
              </label>
            </div>
          </div>
          {autoSearchEnabled && (
            <div className="text-xs text-green-600">
              ✅ Auto-search enabled - results will appear automatically when you type in the company name field
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter vendor name (e.g., 'Microsoft', 'Salesforce')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchVendor()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={searchVendor}
            disabled={isSearching || !searchTerm.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Search Results:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                                                 <div
                  key={result.id}
                  className={`bg-white border rounded-md p-3 cursor-pointer transition-colors ${
                    selectedResult?.id === result.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-blue-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedResult(result)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedResult(result);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${result.name} as vendor information`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{result.name}</h5>
                      <p className="text-sm text-gray-600">{result.industry}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {result.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {result.website}
                          </span>
                        )}
                        {result.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {result.email}
                          </span>
                        )}
                      </div>
                    </div>
                                         <div className="flex items-center gap-2">
                       <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                         {Math.round(result.confidence * 100)}% match
                       </span>
                       {result.source && (
                         <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                           {result.source}
                         </span>
                       )}
                                              <button
                         type="button"
                         className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                         onClick={(e) => {
                           e.stopPropagation();
                           applySearchResult(result);
                         }}
                       >
                         Use This
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Selected Result Preview */}
             {selectedResult && (
               <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                 <h5 className="text-sm font-medium text-blue-900 mb-2">Preview - Fields to be filled:</h5>
                 <div className="grid grid-cols-2 gap-2 text-xs">
                   {selectedResult.name && <div><strong>Name:</strong> {selectedResult.name}</div>}
                   {selectedResult.website && <div><strong>Website:</strong> {selectedResult.website}</div>}
                   {selectedResult.email && <div><strong>Email:</strong> {selectedResult.email}</div>}
                   {selectedResult.phone && <div><strong>Phone:</strong> {selectedResult.phone}</div>}
                   {selectedResult.industry && <div><strong>Industry:</strong> {selectedResult.industry}</div>}
                   {selectedResult.address && <div><strong>Address:</strong> {selectedResult.address}</div>}
                 </div>
                 <div className="mt-3 flex gap-2">
                   <button
                     type="button"
                     onClick={() => applySearchResult(selectedResult)}
                     className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                   >
                     Apply to Form
                   </button>
                   <button
                     type="button"
                     onClick={() => setSelectedResult(null)}
                     className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             )}
             
             <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
               <AlertCircle className="h-3 w-3" />
               Click on a result to preview, then click "Use This" or "Apply to Form"
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <Building2 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Vendor Name *
                {autoSearchEnabled && !vendor && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    <Search className="h-3 w-3 mr-1" />
                    Auto-search enabled
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  className="input pr-10"
                  {...register('name', {
                    required: 'Vendor name is required',
                    maxLength: {
                      value: 200,
                      message: 'Name must be less than 200 characters',
                    },
                  })}
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
              {autoSearchEnabled && !vendor && (
                <p className="mt-1 text-xs text-blue-600">
                  💡 Start typing a company name to automatically search for information
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="input"
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Description must be less than 500 characters',
                  },
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  className="input"
                  {...register('industry')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="card-header">
            <Mail className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Contact Information</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  {...register('phone')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                id="website"
                type="url"
                className="input"
                {...register('website', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://',
                  },
                })}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="card">
          <div className="card-header">
            <MapPin className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Address</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                id="address"
                type="text"
                className="input"
                {...register('address')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  className="input"
                  {...register('city')}
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  id="state"
                  type="text"
                  className="input"
                  {...register('state')}
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP/Postal Code
                </label>
                <input
                  id="zipCode"
                  type="text"
                  className="input"
                  {...register('zipCode')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                id="country"
                type="text"
                className="input"
                {...register('country')}
              />
            </div>
          </div>
        </div>

        {/* Contract Information */}
        <div className="card">
          <div className="card-header">
            <Calendar className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Contract Information</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contractValue" className="block text-sm font-medium text-gray-700">
                  Contract Value
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="contractValue"
                    type="text"
                    className="input pl-10"
                    placeholder="0.00"
                    value={formatCurrency(watchedValues.contractValue)}
                    onChange={handleCurrencyChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contractStartDate" className="block text-sm font-medium text-gray-700">
                  Contract Start Date
                </label>
                <input
                  id="contractStartDate"
                  type="date"
                  className="input"
                  {...register('contractStartDate')}
                />
              </div>

              <div>
                <label htmlFor="contractEndDate" className="block text-sm font-medium text-gray-700">
                  Contract End Date
                </label>
                <input
                  id="contractEndDate"
                  type="date"
                  className="input"
                  {...register('contractEndDate')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="card">
          <div className="card-header">
            <User className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Primary Contact</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="primaryContact" className="block text-sm font-medium text-gray-700">
                Contact Name
              </label>
              <input
                id="primaryContact"
                type="text"
                className="input"
                {...register('primaryContact')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  id="primaryContactEmail"
                  type="email"
                  className="input"
                  {...register('primaryContactEmail', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.primaryContactEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryContactEmail.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="primaryContactPhone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  id="primaryContactPhone"
                  type="tel"
                  className="input"
                  {...register('primaryContactPhone')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status and Risk */}
        <div className="card">
          <div className="card-header">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Status & Risk</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  className="input"
                  {...register('status')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label htmlFor="riskLevel" className="block text-sm font-medium text-gray-700">
                  Risk Level
                </label>
                <select
                  id="riskLevel"
                  className="input"
                  {...register('riskLevel')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSubprocessor"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register('isSubprocessor')}
              />
              <label htmlFor="isSubprocessor" className="ml-2 block text-sm text-gray-700">
                This vendor is also a subprocessor
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Notes</h3>
          </div>
          <div className="card-body">
            <textarea
              rows={4}
              className="input"
              placeholder="Additional notes about the vendor..."
              {...register('notes')}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
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
    </div>
  );
};

export default VendorForm;
