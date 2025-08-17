const mongoose = require('mongoose');
const News = require('./models/News');
const Tenant = require('./models/Tenant');
const Vendor = require('./models/Vendor');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendortrak')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample news data
const sampleNews = [
  {
    title: 'Major Cybersecurity Breach Affects Multiple Cloud Providers',
    summary: 'A widespread security vulnerability has been discovered affecting several major cloud service providers. Organizations are advised to review their security protocols and update their systems immediately.',
    content: 'A critical security vulnerability has been identified in cloud infrastructure services used by multiple major providers. The vulnerability could allow unauthorized access to customer data and systems.',
    url: 'https://example.com/security/cloud-breach-2024',
    publishedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)),
    category: 'breach',
    severity: 'critical',
    source: 'Security Weekly',
    sourceUrl: 'https://securityweekly.com',
    keywords: ['cybersecurity', 'breach', 'cloud', 'vulnerability', 'security'],
    tags: ['critical', 'cloud-security', 'data-breach']
  },
  {
    title: 'New Data Privacy Regulations Coming into Effect',
    summary: 'Updated data privacy regulations will require organizations to implement stricter data handling procedures and enhanced consent mechanisms.',
    content: 'New comprehensive data privacy regulations are set to take effect next month, requiring organizations to implement enhanced data protection measures.',
    url: 'https://example.com/privacy/regulations-2024',
    publishedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)),
    category: 'compliance',
    severity: 'high',
    source: 'Privacy Today',
    sourceUrl: 'https://privacytoday.com',
    keywords: ['privacy', 'regulations', 'compliance', 'data-protection'],
    tags: ['compliance', 'privacy', 'regulations']
  },
  {
    title: 'Supply Chain Security Best Practices Updated',
    summary: 'Industry leaders have released updated guidelines for supply chain security, emphasizing third-party risk management and vendor assessment.',
    content: 'Updated best practices for supply chain security have been published, focusing on vendor risk assessment and third-party management.',
    url: 'https://example.com/security/supply-chain-2024',
    publishedAt: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)),
    category: 'security',
    severity: 'medium',
    source: 'Supply Chain Security',
    sourceUrl: 'https://supplychainsecurity.com',
    keywords: ['supply-chain', 'security', 'vendor-management', 'risk-assessment'],
    tags: ['supply-chain', 'security', 'best-practices']
  },
  {
    title: 'Ransomware Attacks Targeting Healthcare Sector',
    summary: 'Recent ransomware attacks have specifically targeted healthcare organizations, highlighting the need for enhanced cybersecurity measures.',
    content: 'Healthcare organizations are increasingly being targeted by sophisticated ransomware attacks, requiring immediate attention to cybersecurity measures.',
    url: 'https://example.com/security/healthcare-ransomware-2024',
    publishedAt: new Date(Date.now() - (4 * 24 * 60 * 60 * 1000)),
    category: 'security',
    severity: 'high',
    source: 'Healthcare Security News',
    sourceUrl: 'https://healthcaresecurity.com',
    keywords: ['ransomware', 'healthcare', 'cybersecurity', 'attacks'],
    tags: ['ransomware', 'healthcare', 'security']
  },
  {
    title: 'Zero-Day Vulnerability in Popular Software',
    summary: 'A critical zero-day vulnerability has been discovered in widely-used enterprise software. Immediate patching is recommended.',
    content: 'Security researchers have identified a critical zero-day vulnerability affecting enterprise software used by millions of organizations worldwide.',
    url: 'https://example.com/security/zero-day-2024',
    publishedAt: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)),
    category: 'security',
    severity: 'critical',
    source: 'Vulnerability Research',
    sourceUrl: 'https://vulnresearch.com',
    keywords: ['zero-day', 'vulnerability', 'enterprise', 'software', 'critical'],
    tags: ['zero-day', 'vulnerability', 'critical']
  },
  {
    title: 'AI-Powered Security Threats on the Rise',
    summary: 'Security researchers are reporting an increase in AI-powered cyber attacks, requiring new defensive strategies.',
    content: 'Artificial intelligence is being increasingly used by cybercriminals to create more sophisticated and targeted attacks.',
    url: 'https://example.com/security/ai-threats-2024',
    publishedAt: new Date(Date.now() - (6 * 24 * 60 * 60 * 1000)),
    category: 'security',
    severity: 'medium',
    source: 'AI Security Journal',
    sourceUrl: 'https://aisecurity.com',
    keywords: ['ai', 'security', 'threats', 'cyber-attacks', 'artificial-intelligence'],
    tags: ['ai', 'security', 'emerging-threats']
  },
  {
    title: 'Third-Party Risk Management Framework Released',
    summary: 'A comprehensive framework for managing third-party risks has been published, providing guidelines for vendor assessment.',
    content: 'A new comprehensive framework for third-party risk management has been released, offering detailed guidelines for vendor assessment and monitoring.',
    url: 'https://example.com/risk/third-party-framework-2024',
    publishedAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)),
    category: 'compliance',
    severity: 'low',
    source: 'Risk Management Institute',
    sourceUrl: 'https://riskmanagement.com',
    keywords: ['third-party', 'risk-management', 'vendor-assessment', 'framework'],
    tags: ['risk-management', 'vendor-assessment', 'framework']
  },
  {
    title: 'Cloud Security Standards Updated',
    summary: 'Major cloud security standards have been updated to address emerging threats and new attack vectors.',
    content: 'Cloud security standards have been updated to address new threats and provide enhanced protection for cloud-based systems.',
    url: 'https://example.com/security/cloud-standards-2024',
    publishedAt: new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)),
    category: 'security',
    severity: 'medium',
    source: 'Cloud Security Alliance',
    sourceUrl: 'https://cloudsecurityalliance.org',
    keywords: ['cloud', 'security', 'standards', 'threats', 'protection'],
    tags: ['cloud-security', 'standards', 'security']
  }
];

async function seedNews() {
  try {
    console.log('Starting news seeding...');

    // Get all tenants
    const tenants = await Tenant.find({ status: 'active' });
    
    if (tenants.length === 0) {
      console.log('No active tenants found. Creating a test tenant...');
      const testTenant = new Tenant({
        name: 'Test Tenant',
        domain: 'test.com',
        subdomain: 'test',
        status: 'active',
        contactInfo: {
          email: 'admin@test.com',
          phone: '123-456-7890'
        }
      });
      await testTenant.save();
      tenants.push(testTenant);
    }

    // Get vendors for vendor-specific news
    const vendors = await Vendor.find({ isActive: true });

    for (const tenant of tenants) {
      console.log(`Seeding news for tenant: ${tenant.name}`);

      // Create general industry news
      for (const newsItem of sampleNews) {
        const news = new News({
          ...newsItem,
          tenantId: tenant._id,
          isActive: true
        });
        await news.save();
      }

      // Create vendor-specific news if vendors exist
      if (vendors.length > 0) {
        for (const vendor of vendors.slice(0, 3)) { // Limit to first 3 vendors
          const vendorNews = [
            {
              title: `${vendor.name} Security Update Available`,
              summary: `A new security update has been released for ${vendor.name} services. This update addresses critical vulnerabilities and improves overall security posture.`,
              content: `Important security update for ${vendor.name} that addresses multiple vulnerabilities and enhances system security.`,
              url: `https://example.com/vendors/${vendor._id}/security-update`,
              publishedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)),
              category: 'security',
              severity: 'high',
              source: 'VendorTrak Monitoring',
              sourceUrl: 'https://vendortrak.com',
              vendorId: vendor._id,
              vendorName: vendor.name,
              keywords: ['security', 'update', 'vulnerability', vendor.name.toLowerCase()],
              tags: ['vendor-update', 'security', vendor.name.toLowerCase()]
            },
            {
              title: `${vendor.name} Service Maintenance Scheduled`,
              summary: `${vendor.name} has scheduled maintenance that may affect service availability. Please review the maintenance window and plan accordingly.`,
              content: `Scheduled maintenance for ${vendor.name} services that may impact availability during the maintenance window.`,
              url: `https://example.com/vendors/${vendor._id}/maintenance`,
              publishedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)),
              category: 'maintenance',
              severity: 'low',
              source: 'VendorTrak Monitoring',
              sourceUrl: 'https://vendortrak.com',
              vendorId: vendor._id,
              vendorName: vendor.name,
              keywords: ['maintenance', 'service', 'availability', vendor.name.toLowerCase()],
              tags: ['maintenance', 'service', vendor.name.toLowerCase()]
            }
          ];

          for (const newsItem of vendorNews) {
            const news = new News({
              ...newsItem,
              tenantId: tenant._id,
              isActive: true
            });
            await news.save();
          }
        }
      }

      console.log(`Completed seeding news for tenant: ${tenant.name}`);
    }

    console.log('News seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding news:', error);
    process.exit(1);
  }
}

// Run the seeding
seedNews();
