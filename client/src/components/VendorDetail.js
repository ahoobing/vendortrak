import React from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FileText
} from 'lucide-react';

const VendorDetail = ({ vendor }) => {
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
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!vendor) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No vendor data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{vendor.name}</h2>
            <p className="text-gray-600">{vendor.industry || 'Industry not specified'}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                {getStatusIcon(vendor.status)}
                <span className="ml-1 capitalize">{vendor.status}</span>
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(vendor.riskLevel)}`}>
                <span className="capitalize">{vendor.riskLevel || 'N/A'} Risk</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {vendor.description && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700">{vendor.description}</p>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary-600" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{vendor.email || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{vendor.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Website</p>
                <p className="text-sm text-gray-600">
                  {vendor.website ? (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                      {vendor.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Primary Contact</p>
                <p className="text-sm text-gray-600">{vendor.primaryContact || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Contact Email</p>
                <p className="text-sm text-gray-600">{vendor.primaryContactEmail || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Contact Phone</p>
                <p className="text-sm text-gray-600">{vendor.primaryContactPhone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      {(vendor.address || vendor.city || vendor.state || vendor.zipCode || vendor.country) && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Address Information
          </h3>
          
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="text-sm text-gray-700">
              {vendor.address && <p>{vendor.address}</p>}
              {(vendor.city || vendor.state || vendor.zipCode) && (
                <p>
                  {[vendor.city, vendor.state, vendor.zipCode].filter(Boolean).join(', ')}
                </p>
              )}
              {vendor.country && <p>{vendor.country}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Contract Information */}
      {(vendor.contractValue || vendor.contractStartDate || vendor.contractEndDate) && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            Contract Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Contract Value</p>
              <p className="text-sm text-gray-600">{formatCurrency(vendor.contractValue)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">Start Date</p>
              <p className="text-sm text-gray-600">{formatDate(vendor.contractStartDate)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">End Date</p>
              <p className="text-sm text-gray-600">{formatDate(vendor.contractEndDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {vendor.notes && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Additional Notes
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Record Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">Created</p>
            <p className="text-gray-600">{formatDateTime(vendor.createdAt)}</p>
          </div>
          
          <div>
            <p className="font-medium text-gray-900">Last Updated</p>
            <p className="text-gray-600">{formatDateTime(vendor.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetail;
