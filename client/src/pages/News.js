import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Building2, 
  ExternalLink,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { newsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const News = () => {
  const [news, setNews] = useState([]);
  const [industryNews, setIndustryNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, security, vendor-specific
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const [newsResponse, industryResponse] = await Promise.all([
        newsAPI.getVendorNews(),
        newsAPI.getIndustryNews()
      ]);
      
      setNews(newsResponse.data.news || []);
      setIndustryNews(industryResponse.data.news || []);
    } catch (err) {
      setError('Failed to fetch news data');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <Shield className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredNews = news.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'security' && item.category === 'security') ||
      (filter === 'vendor-specific' && item.vendorId);
    
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const filteredIndustryNews = industryNews.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor News & Security</h1>
            <p className="mt-2 text-gray-600">
              Stay updated on vendor-related news and security issues in the industry
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All News</option>
              <option value="security">Security Issues</option>
              <option value="vendor-specific">Vendor Specific</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor News */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary-600" />
                Vendor News
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredNews.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No vendor news found</p>
                </div>
              ) : (
                filteredNews.map((item, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {item.vendorName && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {item.vendorName}
                            </span>
                          )}
                          {item.category === 'security' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Security
                            </span>
                          )}
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(item.publishedAt)}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{item.summary}</p>
                        {item.severity && (
                          <div className="flex items-center space-x-2 mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                              {getSeverityIcon(item.severity)}
                              <span className="ml-1 capitalize">{item.severity} Risk</span>
                            </span>
                          </div>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                          >
                            Read more
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Industry Security News */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Industry Security
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredIndustryNews.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No industry security news</p>
                </div>
              ) : (
                filteredIndustryNews.map((item, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                      {item.summary}
                    </p>
                    {item.severity && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                          {getSeverityIcon(item.severity)}
                          <span className="ml-1 capitalize">{item.severity}</span>
                        </span>
                      </div>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-primary-600 hover:text-primary-800"
                      >
                        Read more
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
