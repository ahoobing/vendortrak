import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { vendorAPI } from '../services/api';
import vendorSearchService from '../services/vendorSearch';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Search, Globe, Building2, Mail, MapPin, Calendar, DollarSign, User, FileText, AlertCircle } from 'lucide-react';

const VendorForm = ({ vendor = null, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

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
    },
  });

  // Watch form values for autofill
  const watchedValues = watch();

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
        toast.info('No exact matches found, but you can still fill in the details manually');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message || 'Search failed. Please try again.');
      
      // Fallback to mock data for demo purposes
      const mockResults = generateMockSearchResults(searchTerm);
      setSearchResults(mockResults);
      setShowSearchResults(true);
      toast.info('Using demo data - in production, this would search real company databases');
    } finally {
      setIsSearching(false);
    }
  };

  // Generate mock search results for demo
  const generateMockSearchResults = (term) => {
    const baseName = term.toLowerCase();
    return [
      {
        id: 1,
        name: `${term} Inc.`,
        website: `https://www.${baseName.replace(/\s+/g, '')}.com`,
        email: `contact@${baseName.replace(/\s+/g, '')}.com`,
        phone: '+1 (555) 123-4567',
        address: '123 Business Ave, Suite 100',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'United States',
        industry: 'Technology',
        description: `${term} is a leading technology company specializing in innovative solutions.`,
        primaryContact: 'John Smith',
        primaryContactEmail: 'john.smith@' + baseName.replace(/\s+/g, '') + '.com',
        primaryContactPhone: '+1 (555) 123-4568',
        confidence: 0.95
      },
      {
        id: 2,
        name: `${term} Technologies`,
        website: `https://www.${baseName.replace(/\s+/g, '')}tech.com`,
        email: `info@${baseName.replace(/\s+/g, '')}tech.com`,
        phone: '+1 (555) 987-6543',
        address: '456 Innovation Blvd',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        country: 'United States',
        industry: 'Software Development',
        description: `${term} Technologies provides cutting-edge software solutions for modern businesses.`,
        primaryContact: 'Sarah Johnson',
        primaryContactEmail: 'sarah.johnson@' + baseName.replace(/\s+/g, '') + 'tech.com',
        primaryContactPhone: '+1 (555) 987-6544',
        confidence: 0.87
      }
    ];
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Auto-fill Vendor Information</h3>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          Search for vendor information online to automatically fill the form fields.
        </p>
        
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
              </label>
              <input
                id="name"
                type="text"
                className="input"
                {...register('name', {
                  required: 'Vendor name is required',
                  maxLength: {
                    value: 200,
                    message: 'Name must be less than 200 characters',
                  },
                })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
