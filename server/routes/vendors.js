const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Vendor = require('../models/Vendor');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all vendor routes
router.use(authenticateToken);

// Get all vendors for tenant with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  query('riskLevel').optional().isIn(['low', 'medium', 'high']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      status,
      riskLevel,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { tenantId: req.tenant._id };
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      Vendor.find(filter)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Vendor.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Failed to get vendors' });
  }
});

// Search for vendor information online
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // In a real implementation, you would integrate with external APIs like:
    // - Clearbit API for company data
    // - Company House API (UK)
    // - OpenCorporates API
    // - Crunchbase API
    // - LinkedIn Company API
    
    // Try to get real data from OpenCorporates API (free tier or with API key)
    let realResults = [];
    try {
      const apiKey = process.env.OPENCORPORATES_API_KEY;
      const apiUrl = apiKey 
        ? `https://api.opencorporates.com/companies/search?q=${encodeURIComponent(q)}&api_token=${apiKey}`
        : `https://api.opencorporates.com/companies/search?q=${encodeURIComponent(q)}`;
      
      const openCorporatesResponse = await fetch(apiUrl);
      if (openCorporatesResponse.ok) {
        const openCorporatesData = await openCorporatesResponse.json();
        if (openCorporatesData.results && openCorporatesData.results.companies) {
          realResults = openCorporatesData.results.companies.slice(0, 5).map(company => ({
            id: `opencorp-${company.company.id}`,
            name: company.company.name,
            website: company.company.homepage_url || '',
            email: '', // OpenCorporates doesn't provide email
            phone: company.company.phone_number || '',
            address: company.company.registered_address_in_full || '',
            city: company.company.registered_address?.locality || '',
            state: company.company.registered_address?.region || '',
            zipCode: company.company.registered_address?.postal_code || '',
            country: company.company.registered_address?.country || company.company.jurisdiction_code || '',
            industry: company.company.industry_codes?.[0]?.industry_code?.name || 'Unknown',
            description: `${company.company.name} - ${company.company.company_type || 'Registered Company'}`,
            primaryContact: '',
            primaryContactEmail: '',
            primaryContactPhone: company.company.phone_number || '',
            confidence: 0.85,
            source: 'OpenCorporates',
            incorporationDate: company.company.incorporation_date,
            companyNumber: company.company.company_number
          }));
        }
      }
    } catch (error) {
      console.log('OpenCorporates API call failed, using fallback data');
    }

    // Fallback mock data if no real results found
    const mockResults = realResults.length > 0 ? [] : [
      {
        id: 1,
        name: `${q} Inc.`,
        website: `https://www.${q.toLowerCase().replace(/\s+/g, '')}.com`,
        email: `contact@${q.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: '+1 (555) 123-4567',
        address: '123 Business Ave, Suite 100',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'United States',
        industry: 'Technology',
        description: `${q} is a leading technology company specializing in innovative solutions.`,
        primaryContact: 'John Smith',
        primaryContactEmail: 'john.smith@' + q.toLowerCase().replace(/\s+/g, '') + '.com',
        primaryContactPhone: '+1 (555) 123-4568',
        confidence: 0.95,
        source: 'Mock Data'
      },
      {
        id: 2,
        name: `${q} Technologies`,
        website: `https://www.${q.toLowerCase().replace(/\s+/g, '')}tech.com`,
        email: `info@${q.toLowerCase().replace(/\s+/g, '')}tech.com`,
        phone: '+1 (555) 987-6543',
        address: '456 Innovation Blvd',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        country: 'United States',
        industry: 'Software Development',
        description: `${q} Technologies provides cutting-edge software solutions for modern businesses.`,
        primaryContact: 'Sarah Johnson',
        primaryContactEmail: 'sarah.johnson@' + q.toLowerCase().replace(/\s+/g, '') + 'tech.com',
        primaryContactPhone: '+1 (555) 987-6544',
        confidence: 0.87,
        source: 'Mock Data'
      }
    ];

    const allResults = [...realResults, ...mockResults];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      results: allResults,
      query: q,
      total: allResults.length,
      message: realResults.length > 0 
        ? `Found ${realResults.length} real company records from OpenCorporates API` 
        : 'Using demo data - no real company records found'
    });

  } catch (error) {
    console.error('Error searching vendors:', error);
    res.status(500).json({ error: 'Failed to search vendors' });
  }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    })
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName')
    .populate('performance.reviews.reviewer', 'firstName lastName');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ vendor });

  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ error: 'Failed to get vendor' });
  }
});

// Create new vendor
router.post('/', requireManager, [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Vendor name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('website').optional().isURL().withMessage('Valid URL required'),
  body('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  body('riskLevel').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendorData = {
      ...req.body,
      tenantId: req.tenant._id,
      createdBy: req.user._id
    };

    const vendor = new Vendor(vendorData);
    await vendor.save();

    const populatedVendor = await Vendor.findById(vendor._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: populatedVendor
    });

  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/:id', requireManager, [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('email').optional().isEmail(),
  body('website').optional().isURL(),
  body('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  body('riskLevel').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await Vendor.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenant._id
      },
      {
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({
      message: 'Vendor updated successfully',
      vendor
    });

  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Delete vendor
router.delete('/:id', requireManager, async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });

  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// Add contract to vendor
router.post('/:id/contracts', requireManager, [
  body('contractNumber').trim().notEmpty().withMessage('Contract number required'),
  body('name').trim().notEmpty().withMessage('Contract name required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('value.amount').isFloat({ min: 0 }).withMessage('Valid contract value required'),
  body('value.currency').optional().isLength({ min: 3, max: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.contracts.push(req.body);
    await vendor.save();

    res.status(201).json({
      message: 'Contract added successfully',
      contract: vendor.contracts[vendor.contracts.length - 1]
    });

  } catch (error) {
    console.error('Add contract error:', error);
    res.status(500).json({ error: 'Failed to add contract' });
  }
});

// Update contract
router.put('/:id/contracts/:contractId', requireManager, [
  body('contractNumber').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('value.amount').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'expired', 'terminated', 'pending'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const contract = vendor.contracts.id(req.params.contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    Object.assign(contract, req.body);
    await vendor.save();

    res.json({
      message: 'Contract updated successfully',
      contract
    });

  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

// Add data type to vendor
router.post('/:id/data-types', requireManager, [
  body('name').trim().notEmpty().withMessage('Data type name required'),
  body('category').trim().notEmpty().withMessage('Category required'),
  body('sensitivity').optional().isIn(['public', 'internal', 'confidential', 'restricted'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.dataTypes.push(req.body);
    await vendor.save();

    res.status(201).json({
      message: 'Data type added successfully',
      dataType: vendor.dataTypes[vendor.dataTypes.length - 1]
    });

  } catch (error) {
    console.error('Add data type error:', error);
    res.status(500).json({ error: 'Failed to add data type' });
  }
});

// Add performance review
router.post('/:id/reviews', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const review = {
      ...req.body,
      reviewer: req.user._id
    };

    vendor.performance.reviews.push(review);
    
    // Update average rating
    const totalRating = vendor.performance.reviews.reduce((sum, r) => sum + r.rating, 0);
    vendor.performance.rating = totalRating / vendor.performance.reviews.length;
    
    await vendor.save();

    const populatedVendor = await Vendor.findById(vendor._id)
      .populate('performance.reviews.reviewer', 'firstName lastName');

    res.status(201).json({
      message: 'Review added successfully',
      review: populatedVendor.performance.reviews[populatedVendor.performance.reviews.length - 1]
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get vendor statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const stats = {
      totalContracts: vendor.contracts.length,
      activeContracts: vendor.contracts.filter(c => c.status === 'active').length,
      totalContractValue: vendor.totalContractValue,
      dataTypesCount: vendor.dataTypes.length,
      reviewsCount: vendor.performance.reviews.length,
      averageRating: vendor.performance.rating,
      riskLevel: vendor.riskLevel,
      status: vendor.status
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ error: 'Failed to get vendor statistics' });
  }
});

module.exports = router;
