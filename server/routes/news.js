const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');

// Get vendor-specific news
router.get('/vendors', async (req, res) => {
  try {
    const { limit = 20, offset = 0, vendorId, category } = req.query;
    
    // In a real implementation, this would fetch from a news API or database
    // For now, we'll return mock data based on vendors in the system
    const vendors = await Vendor.find().limit(parseInt(limit));
    
    const mockVendorNews = vendors.map((vendor, index) => ({
      id: `news-${vendor._id}-${index}`,
      title: `${vendor.name} ${index % 3 === 0 ? 'Security Update' : index % 3 === 1 ? 'Service Announcement' : 'Contract Renewal'}`,
      summary: index % 3 === 0 
        ? `Important security update for ${vendor.name} services. Please review the latest security patches and updates.`
        : index % 3 === 1
        ? `${vendor.name} has announced new service features and improvements to their platform.`
        : `${vendor.name} contract is up for renewal. Review terms and conditions.`,
      publishedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
      url: `https://example.com/news/${vendor._id}-${index}`,
      category: index % 3 === 0 ? 'security' : 'general',
      severity: index % 3 === 0 ? (index % 4 === 0 ? 'critical' : index % 4 === 1 ? 'high' : 'medium') : null,
      vendorId: vendor._id.toString(),
      vendorName: vendor.name,
      source: 'VendorTrak Monitoring'
    }));

    // Filter by vendor if specified
    let filteredNews = mockVendorNews;
    if (vendorId) {
      filteredNews = mockVendorNews.filter(news => news.vendorId === vendorId);
    }
    
    // Filter by category if specified
    if (category) {
      filteredNews = filteredNews.filter(news => news.category === category);
    }

    // Apply pagination
    const paginatedNews = filteredNews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      news: paginatedNews,
      total: filteredNews.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching vendor news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor news'
    });
  }
});

// Get industry security news
router.get('/industry', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    // Mock industry security news
    const mockIndustryNews = [
      {
        id: 'industry-1',
        title: 'Major Cybersecurity Breach Affects Multiple Cloud Providers',
        summary: 'A widespread security vulnerability has been discovered affecting several major cloud service providers. Organizations are advised to review their security protocols.',
        publishedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/cybersecurity-breach-2024',
        category: 'security',
        severity: 'critical',
        source: 'Security Weekly'
      },
      {
        id: 'industry-2',
        title: 'New Data Privacy Regulations Coming into Effect',
        summary: 'Updated data privacy regulations will require organizations to implement stricter data handling procedures and enhanced consent mechanisms.',
        publishedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/data-privacy-regulations-2024',
        category: 'compliance',
        severity: 'high',
        source: 'Privacy Today'
      },
      {
        id: 'industry-3',
        title: 'Supply Chain Security Best Practices Updated',
        summary: 'Industry leaders have released updated guidelines for supply chain security, emphasizing third-party risk management and vendor assessment.',
        publishedAt: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/supply-chain-security-2024',
        category: 'security',
        severity: 'medium',
        source: 'Supply Chain Security'
      },
      {
        id: 'industry-4',
        title: 'Ransomware Attacks Targeting Healthcare Sector',
        summary: 'Recent ransomware attacks have specifically targeted healthcare organizations, highlighting the need for enhanced cybersecurity measures.',
        publishedAt: new Date(Date.now() - (4 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/healthcare-ransomware-2024',
        category: 'security',
        severity: 'high',
        source: 'Healthcare Security News'
      },
      {
        id: 'industry-5',
        title: 'Zero-Day Vulnerability in Popular Software',
        summary: 'A critical zero-day vulnerability has been discovered in widely-used enterprise software. Immediate patching is recommended.',
        publishedAt: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/zero-day-vulnerability-2024',
        category: 'security',
        severity: 'critical',
        source: 'Vulnerability Research'
      },
      {
        id: 'industry-6',
        title: 'AI-Powered Security Threats on the Rise',
        summary: 'Security researchers are reporting an increase in AI-powered cyber attacks, requiring new defensive strategies.',
        publishedAt: new Date(Date.now() - (6 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/ai-security-threats-2024',
        category: 'security',
        severity: 'medium',
        source: 'AI Security Journal'
      },
      {
        id: 'industry-7',
        title: 'Third-Party Risk Management Framework Released',
        summary: 'A comprehensive framework for managing third-party risks has been published, providing guidelines for vendor assessment.',
        publishedAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/third-party-risk-framework-2024',
        category: 'compliance',
        severity: 'low',
        source: 'Risk Management Institute'
      },
      {
        id: 'industry-8',
        title: 'Cloud Security Standards Updated',
        summary: 'Major cloud security standards have been updated to address emerging threats and new attack vectors.',
        publishedAt: new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString(),
        url: 'https://example.com/industry/cloud-security-standards-2024',
        category: 'security',
        severity: 'medium',
        source: 'Cloud Security Alliance'
      }
    ];

    // Apply pagination
    const paginatedNews = mockIndustryNews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      news: paginatedNews,
      total: mockIndustryNews.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching industry news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch industry news'
    });
  }
});

// Get security alerts
router.get('/security-alerts', async (req, res) => {
  try {
    const { limit = 10, offset = 0, severity } = req.query;
    
    // Mock security alerts
    const mockSecurityAlerts = [
      {
        id: 'alert-1',
        title: 'Critical: Zero-Day Exploit in Vendor Software',
        summary: 'A critical zero-day vulnerability has been discovered in software used by multiple vendors. Immediate action required.',
        publishedAt: new Date(Date.now() - (1 * 60 * 60 * 1000)).toISOString(), // 1 hour ago
        url: 'https://example.com/alerts/zero-day-exploit-2024',
        severity: 'critical',
        affectedVendors: ['Vendor A', 'Vendor B', 'Vendor C'],
        recommendedAction: 'Apply security patch immediately',
        source: 'Security Response Team'
      },
      {
        id: 'alert-2',
        title: 'High: Data Breach Reported by Cloud Provider',
        summary: 'A major cloud service provider has reported a data breach affecting customer data. Review your data exposure.',
        publishedAt: new Date(Date.now() - (3 * 60 * 60 * 1000)).toISOString(), // 3 hours ago
        url: 'https://example.com/alerts/cloud-breach-2024',
        severity: 'high',
        affectedVendors: ['Cloud Provider X'],
        recommendedAction: 'Review data access logs and change credentials',
        source: 'Incident Response'
      },
      {
        id: 'alert-3',
        title: 'Medium: Phishing Campaign Targeting Vendor Accounts',
        summary: 'A sophisticated phishing campaign is targeting vendor management accounts. Be vigilant about suspicious emails.',
        publishedAt: new Date(Date.now() - (6 * 60 * 60 * 1000)).toISOString(), // 6 hours ago
        url: 'https://example.com/alerts/phishing-campaign-2024',
        severity: 'medium',
        affectedVendors: ['All Vendors'],
        recommendedAction: 'Enable multi-factor authentication and review email security',
        source: 'Threat Intelligence'
      }
    ];

    // Filter by severity if specified
    let filteredAlerts = mockSecurityAlerts;
    if (severity) {
      filteredAlerts = mockSecurityAlerts.filter(alert => alert.severity === severity);
    }

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      alerts: paginatedAlerts,
      total: filteredAlerts.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security alerts'
    });
  }
});

// Get news by specific vendor
router.get('/vendors/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Mock vendor-specific news
    const mockVendorNews = [
      {
        id: `vendor-${vendorId}-1`,
        title: `${vendor.name} Security Update Available`,
        summary: `A new security update has been released for ${vendor.name} services. This update addresses critical vulnerabilities.`,
        publishedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
        url: `https://example.com/vendors/${vendorId}/security-update`,
        category: 'security',
        severity: 'high',
        vendorId: vendorId,
        vendorName: vendor.name,
        source: 'VendorTrak Monitoring'
      },
      {
        id: `vendor-${vendorId}-2`,
        title: `${vendor.name} Service Maintenance Scheduled`,
        summary: `${vendor.name} has scheduled maintenance that may affect service availability.`,
        publishedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
        url: `https://example.com/vendors/${vendorId}/maintenance`,
        category: 'maintenance',
        severity: 'low',
        vendorId: vendorId,
        vendorName: vendor.name,
        source: 'VendorTrak Monitoring'
      }
    ];

    // Apply pagination
    const paginatedNews = mockVendorNews.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      news: paginatedNews,
      total: mockVendorNews.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      vendor: {
        id: vendor._id,
        name: vendor.name
      }
    });
  } catch (error) {
    console.error('Error fetching vendor-specific news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor-specific news'
    });
  }
});

// Get news statistics
router.get('/stats', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    
    // Mock statistics
    const stats = {
      totalNewsItems: vendors.length * 3 + 8, // 3 per vendor + 8 industry news
      securityAlerts: 3,
      criticalIssues: 2,
      highRiskIssues: 4,
      mediumRiskIssues: 6,
      lowRiskIssues: 8,
      vendorsWithNews: vendors.length,
      lastUpdated: new Date().toISOString(),
      newsSources: ['VendorTrak Monitoring', 'Security Weekly', 'Privacy Today', 'Supply Chain Security']
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching news stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news statistics'
    });
  }
});

module.exports = router;
