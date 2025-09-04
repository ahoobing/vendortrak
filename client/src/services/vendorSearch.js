// Vendor Search Service
// This service handles searching for vendor information from various sources
import { api } from './api';

class VendorSearchService {
  constructor() {
    this.baseURL = '/api/vendors';
  }

  // Search for vendor information
  async searchVendors(query) {
    try {
      // Try to get real data from multiple sources
      const results = [];
      
      // 1. Try Clearbit API (if API key is available)
      try {
        const clearbitResults = await this.searchClearbit(query);
        results.push(...clearbitResults);
      } catch (error) {
        console.log('Clearbit API not available, skipping...');
      }
      
      // 2. Try OpenCorporates API (free tier)
      try {
        const openCorporatesResults = await this.searchOpenCorporates(query);
        results.push(...openCorporatesResults);
      } catch (error) {
        console.log('OpenCorporates API failed, skipping...');
      }
      
      // 3. Try Company House API (UK companies, if API key is available)
      try {
        const companyHouseResults = await this.searchCompanyHouse(query);
        results.push(...companyHouseResults);
      } catch (error) {
        console.log('Company House API not available, skipping...');
      }
      
      // 4. Try simple web search for additional company info
      try {
        const webSearchResults = await this.searchWeb(query);
        results.push(...webSearchResults);
      } catch (error) {
        console.log('Web search failed, skipping...');
      }
      
      // 5. Fallback to our backend search (which now includes real OpenCorporates data)
      if (results.length === 0) {
        const response = await api.get(`${this.baseURL}/search?q=${encodeURIComponent(query)}`);
        return response.data;
      }
      
      return {
        results,
        query,
        total: results.length,
        message: `Found ${results.length} real company records from external APIs`
      };
    } catch (error) {
      console.error('Vendor search error:', error);
      throw error;
    }
  }

  // Enhanced search with multiple data sources (for future implementation)
  async enhancedSearch(query) {
    // This method could integrate with multiple APIs:
    // - Clearbit API for company data
    // - Company House API (UK companies)
    // - OpenCorporates API
    // - Crunchbase API
    // - LinkedIn Company API
    // - Google Places API for business info
    
    const results = [];
    
    try {
      // Example: Clearbit API integration
      // const clearbitResult = await this.searchClearbit(query);
      // results.push(...clearbitResult);
      
      // Example: Company House API (UK)
      // const companyHouseResult = await this.searchCompanyHouse(query);
      // results.push(...companyHouseResult);
      
      // Example: OpenCorporates API
      // const openCorporatesResult = await this.searchOpenCorporates(query);
      // results.push(...openCorporatesResult);
      
      // For now, fall back to our basic search
      const basicResult = await this.searchVendors(query);
      results.push(...basicResult.results);
      
      return {
        results,
        sources: ['internal'],
        total: results.length
      };
    } catch (error) {
      console.error('Enhanced search error:', error);
      throw error;
    }
  }

  // Example: Clearbit API integration
  async searchClearbit(query) {
    // This would require a Clearbit API key
    // const CLEARBIT_API_KEY = process.env.REACT_APP_CLEARBIT_API_KEY;
    
    // For now, return empty array - uncomment when API key is available
    return [];
    
    // try {
    //   const response = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${query}`, {
    //     headers: {
    //       'Authorization': `Bearer ${CLEARBIT_API_KEY}`
    //     }
    //   });
      
    //   if (response.ok) {
    //     const data = await response.json();
    //     return [this.formatClearbitResult(data)];
    //   }
      
    //   return [];
    // } catch (error) {
    //   console.error('Clearbit search error:', error);
    //   return [];
    // }
  }

  // Example: Company House API integration (UK)
  async searchCompanyHouse(query) {
    // This would require a Company House API key
    // const COMPANY_HOUSE_API_KEY = process.env.REACT_APP_COMPANY_HOUSE_API_KEY;
    
    // For now, return empty array - uncomment when API key is available
    return [];
    
    // try {
    //   const response = await fetch(`https://api.companieshouse.gov.uk/search/companies?q=${query}`, {
    //     headers: {
    //       'Authorization': `Basic ${btoa(COMPANY_HOUSE_API_KEY + ':')}`
    //     }
    //   });
      
    //   if (response.ok) {
    //     const data = await response.json();
    //     return data.items.map(item => this.formatCompanyHouseResult(item));
    //   }
      
    //   return [];
    // } catch (error) {
    //   console.error('Company House search error:', error);
    //   return [];
    // }
  }

  // OpenCorporates API integration (free tier available)
  async searchOpenCorporates(query) {
    try {
      // Check if we have an API key from environment
      const apiKey = process.env.REACT_APP_OPENCORPORATES_API_KEY;
      const apiUrl = apiKey 
        ? `https://api.opencorporates.com/companies/search?q=${encodeURIComponent(query)}&api_token=${apiKey}`
        : `https://api.opencorporates.com/companies/search?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.companies) {
          return data.results.companies.slice(0, 5).map(company => this.formatOpenCorporatesResult(company));
        }
      }
      
      return [];
    } catch (error) {
      console.error('OpenCorporates search error:', error);
      return [];
    }
  }

  // Format Clearbit result
  formatClearbitResult(data) {
    return {
      id: `clearbit-${data.id}`,
      name: data.name,
      website: data.domain,
      email: data.email,
      phone: data.phone,
      address: data.geo?.streetNumber + ' ' + data.geo?.streetName,
      city: data.geo?.city,
      state: data.geo?.state,
      zipCode: data.geo?.postalCode,
      country: data.geo?.country,
      industry: data.category?.industry,
      description: data.description,
      primaryContact: data.site?.title,
      primaryContactEmail: data.email,
      primaryContactPhone: data.phone,
      confidence: 0.95,
      source: 'Clearbit'
    };
  }

  // Format Company House result
  formatCompanyHouseResult(data) {
    return {
      id: `companyhouse-${data.company_number}`,
      name: data.title,
      website: data.links?.website,
      email: null,
      phone: null,
      address: data.address_snippet,
      city: data.address?.locality,
      state: data.address?.region,
      zipCode: data.address?.postal_code,
      country: 'United Kingdom',
      industry: data.sic_codes?.[0],
      description: `${data.title} is a UK registered company`,
      primaryContact: null,
      primaryContactEmail: null,
      primaryContactPhone: null,
      confidence: 0.90,
      source: 'Company House'
    };
  }

  // Enhanced web search for company information
  async searchWeb(query) {
    try {
      // Use multiple search strategies to find comprehensive company information
      const results = [];
      
      // 1. Try to extract domain from query if it looks like a website
      const domainMatch = query.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
      if (domainMatch) {
        const domain = domainMatch[1];
        const domainResult = await this.searchByDomain(domain);
        if (domainResult) {
          results.push(domainResult);
        }
      }
      
      // 2. Search for company information using various patterns
      const companyPatterns = [
        `${query} Inc`,
        `${query} LLC`,
        `${query} Corp`,
        `${query} Ltd`,
        `${query} Solutions`,
        `${query} Technologies`,
        `${query} Group`,
        `${query} Systems`,
        `${query} Services`
      ];
      
      for (const pattern of companyPatterns.slice(0, 3)) { // Limit to avoid too many requests
        const patternResult = await this.searchCompanyPattern(pattern, query);
        if (patternResult) {
          results.push(patternResult);
        }
      }
      
      // 3. If no results found, create a realistic company profile
      // No fallback data - only return real search results
      
      return results;
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  // Search for company information by domain
  async searchByDomain(domain) {
    try {
      // In a real implementation, you would:
      // 1. Use WHOIS API to get domain information
      // 2. Use company APIs like Clearbit, FullContact, etc.
      // 3. Scrape company websites for contact information
      
      // For now, return null to avoid mock data
      console.log(`Domain search for ${domain} - no real API integration available`);
      return null;
    } catch (error) {
      console.error('Domain search error:', error);
      return null;
    }
  }

  // Search for company using various patterns
  async searchCompanyPattern(pattern, originalQuery) {
    try {
      // In a real implementation, you would search business directories,
      // company databases, and other sources
      
      // For now, return null to avoid mock data
      console.log(`Pattern search for ${pattern} - no real API integration available`);
      return null;
    } catch (error) {
      console.error('Pattern search error:', error);
      return null;
    }
  }



  // Format OpenCorporates result
  formatOpenCorporatesResult(data) {
    return {
      id: `opencorporates-${data.company.id}`,
      name: data.company.name,
      website: data.company.homepage_url,
      email: null,
      phone: null,
      address: data.company.registered_address_in_full,
      city: null,
      state: null,
      zipCode: null,
      country: data.company.jurisdiction_code,
      industry: data.company.industry_codes?.[0]?.industry_code,
      description: `${data.company.name} is a registered company`,
      primaryContact: null,
      primaryContactEmail: null,
      primaryContactPhone: null,
      confidence: 0.85,
      source: 'OpenCorporates'
    };
  }

  // Validate and clean search query
  validateQuery(query) {
    if (!query || typeof query !== 'string') {
      throw new Error('Search query is required');
    }

    const cleaned = query.trim();
    if (cleaned.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    if (cleaned.length > 100) {
      throw new Error('Search query must be less than 100 characters');
    }

    return cleaned;
  }

  // Get search suggestions based on partial input
  async getSuggestions(partialQuery) {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    try {
      const result = await this.searchVendors(partialQuery);
      return result.results.slice(0, 5).map(item => ({
        name: item.name,
        industry: item.industry,
        website: item.website
      }));
    } catch (error) {
      console.error('Get suggestions error:', error);
      return [];
    }
  }
}

const vendorSearchService = new VendorSearchService();
export default vendorSearchService;
