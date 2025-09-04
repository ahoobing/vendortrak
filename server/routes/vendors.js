const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Vendor = require('../models/Vendor');
const { authenticateToken, requireManager } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Apply authentication to all vendor routes
router.use(authenticateToken);

// Export vendors to CSV
router.get('/export', [
  query('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  query('riskLevel').optional().isIn(['low', 'medium', 'high']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, riskLevel, search } = req.query;

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

    // Get all vendors matching the filter (no pagination for export)
    const vendors = await Vendor.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
      .sort({ name: 1 });

    // Convert vendors to CSV format
    const csvHeaders = [
      'Name',
      'Email',
      'Phone',
      'Website',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Country',
      'Industry',
      'Description',
      'Status',
      'Risk Level',
      'Contract Value',
      'Contract Start Date',
      'Contract End Date',
      'Primary Contact',
      'Primary Contact Email',
      'Primary Contact Phone',
      'Notes',
      'Data Types',
      'Created By',
      'Created At',
      'Updated By',
      'Updated At'
    ];

    const csvRows = vendors.map(vendor => {
      const dataTypes = vendor.dataTypes.map(dt => 
        dt.dataTypeId ? `${dt.dataTypeId.name} (${dt.dataTypeId.classification})` : 'N/A'
      ).join('; ');

      return [
        vendor.name || '',
        vendor.email || '',
        vendor.phone || '',
        vendor.website || '',
        vendor.address || '',
        vendor.city || '',
        vendor.state || '',
        vendor.zipCode || '',
        vendor.country || '',
        vendor.industry || '',
        vendor.description || '',
        vendor.status || '',
        vendor.riskLevel || '',
        vendor.contractValue || '',
        vendor.contractStartDate ? vendor.contractStartDate.toISOString().split('T')[0] : '',
        vendor.contractEndDate ? vendor.contractEndDate.toISOString().split('T')[0] : '',
        vendor.primaryContact || '',
        vendor.primaryContactEmail || '',
        vendor.primaryContactPhone || '',
        vendor.notes || '',
        dataTypes,
        vendor.createdBy ? `${vendor.createdBy.firstName} ${vendor.createdBy.lastName}` : '',
        vendor.createdAt ? vendor.createdAt.toISOString() : '',
        vendor.updatedBy ? `${vendor.updatedBy.firstName} ${vendor.updatedBy.lastName}` : '',
        vendor.updatedAt ? vendor.updatedAt.toISOString() : ''
      ];
    });

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV content
    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    // Set response headers for CSV download
    const filename = `vendors_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(csvContent);

  } catch (error) {
    console.error('Export vendors error:', error);
    res.status(500).json({ error: 'Failed to export vendors' });
  }
});

// Export vendors to PDF
router.get('/export/pdf', [
  query('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  query('riskLevel').optional().isIn(['low', 'medium', 'high']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, riskLevel, search } = req.query;

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

    // Get all vendors matching the filter
    const vendors = await Vendor.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
      .sort({ name: 1 });

    console.log('🔧 [PDF] Starting PDF generation with PDFKit...');
    console.log('🔧 [PDF] Found', vendors.length, 'vendors to export');

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Collect PDF data
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      console.log('🔧 [PDF] PDF generated successfully, size:', pdfBuffer.length, 'bytes');

      // Set response headers for PDF download
      const filename = `vendors_export_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Length', pdfBuffer.length);

      console.log('🔧 [PDF] Sending PDF response with headers:');
      console.log('🔧 [PDF] Content-Type:', res.getHeader('Content-Type'));
      console.log('🔧 [PDF] Content-Disposition:', res.getHeader('Content-Disposition'));
      console.log('🔧 [PDF] Content-Length:', res.getHeader('Content-Length'));

      res.send(pdfBuffer);
    });

    // Generate PDF content
    generateVendorPDF(doc, vendors, req.tenant.name, { status, riskLevel, search });

  } catch (error) {
    console.error('Export vendors to PDF error:', error);
    res.status(500).json({ error: 'Failed to export vendors to PDF' });
  }
});

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
        .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
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
    .populate('updatedBy', 'firstName lastName');

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

// Get vendor data types
router.get('/:id/data-types', async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).populate('dataTypes.dataTypeId', 'name description classification riskLevel')
      .populate('dataTypes.assignedBy', 'firstName lastName');

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ dataTypes: vendor.dataTypes });

  } catch (error) {
    console.error('Get vendor data types error:', error);
    res.status(500).json({ error: 'Failed to get vendor data types' });
  }
});

// Add data type to vendor
router.post('/:id/data-types', requireManager, [
  body('dataTypeId').isMongoId().withMessage('Valid data type ID is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
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

    // Check if data type is already assigned
    const existingAssignment = vendor.dataTypes.find(
      dt => dt.dataTypeId.toString() === req.body.dataTypeId
    );

    if (existingAssignment) {
      return res.status(400).json({ error: 'Data type is already assigned to this vendor' });
    }

    // Add the data type assignment
    vendor.dataTypes.push({
      dataTypeId: req.body.dataTypeId,
      assignedBy: req.user._id,
      notes: req.body.notes || ''
    });

    await vendor.save();

    // Populate the newly added data type
    const populatedVendor = await Vendor.findById(vendor._id)
      .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
      .populate('dataTypes.assignedBy', 'firstName lastName');

    const newAssignment = populatedVendor.dataTypes[populatedVendor.dataTypes.length - 1];

    res.status(201).json({
      message: 'Data type assigned successfully',
      dataType: newAssignment
    });

  } catch (error) {
    console.error('Add data type to vendor error:', error);
    res.status(500).json({ error: 'Failed to assign data type to vendor' });
  }
});

// Update data type assignment
router.put('/:id/data-types/:dataTypeId', requireManager, [
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
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

    const dataTypeAssignment = vendor.dataTypes.find(
      dt => dt.dataTypeId.toString() === req.params.dataTypeId
    );

    if (!dataTypeAssignment) {
      return res.status(404).json({ error: 'Data type assignment not found' });
    }

    // Update the assignment
    if (req.body.notes !== undefined) {
      dataTypeAssignment.notes = req.body.notes;
    }

    await vendor.save();

    // Populate the updated data type
    const populatedVendor = await Vendor.findById(vendor._id)
      .populate('dataTypes.dataTypeId', 'name description classification riskLevel')
      .populate('dataTypes.assignedBy', 'firstName lastName');

    const updatedAssignment = populatedVendor.dataTypes.find(
      dt => dt.dataTypeId._id.toString() === req.params.dataTypeId
    );

    res.json({
      message: 'Data type assignment updated successfully',
      dataType: updatedAssignment
    });

  } catch (error) {
    console.error('Update data type assignment error:', error);
    res.status(500).json({ error: 'Failed to update data type assignment' });
  }
});

// Remove data type from vendor
router.delete('/:id/data-types/:dataTypeId', requireManager, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const dataTypeIndex = vendor.dataTypes.findIndex(
      dt => dt.dataTypeId.toString() === req.params.dataTypeId
    );

    if (dataTypeIndex === -1) {
      return res.status(404).json({ error: 'Data type assignment not found' });
    }

    // Remove the data type assignment
    vendor.dataTypes.splice(dataTypeIndex, 1);
    await vendor.save();

    res.json({ message: 'Data type removed from vendor successfully' });

  } catch (error) {
    console.error('Remove data type from vendor error:', error);
    res.status(500).json({ error: 'Failed to remove data type from vendor' });
  }
});

// Helper function to generate PDF content using PDFKit
function generateVendorPDF(doc, vendors, tenantName, filters) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#111827')
     .text('Vendor Export Report', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(16)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text(tenantName, { align: 'center' });
  
  doc.moveDown(1);

  // Report Information
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#111827')
     .text('Report Information');
  
  doc.moveDown(0.3);
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text(`Export Date: ${exportDate}`)
     .text(`Total Vendors: ${vendors.length}`);

  // Add filter information if any
  const filterInfo = [];
  if (filters.status) filterInfo.push(`Status: ${filters.status}`);
  if (filters.riskLevel) filterInfo.push(`Risk Level: ${filters.riskLevel}`);
  if (filters.search) filterInfo.push(`Search: "${filters.search}"`);
  
  if (filterInfo.length > 0) {
    doc.text(`Filters Applied: ${filterInfo.join(', ')}`);
  }

  doc.moveDown(1);

  // Summary Statistics
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#111827')
     .text('Summary Statistics');
  
  doc.moveDown(0.5);
  
  const totalValue = vendors.reduce((sum, v) => sum + (v.contractValue || 0), 0);
  const activeCount = vendors.filter(v => v.status === 'active').length;
  const highRiskCount = vendors.filter(v => v.riskLevel === 'high').length;

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text(`Total Vendors: ${vendors.length}`, { continued: true })
     .text(` | Active: ${activeCount}`, { continued: true })
     .text(` | High Risk: ${highRiskCount}`, { continued: true })
     .text(` | Total Value: ${formatCurrency(totalValue)}`);

  doc.moveDown(1.5);

  // Vendor Table
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#111827')
     .text('Vendor Details');
  
  doc.moveDown(0.5);

  // Table headers
  const tableTop = doc.y;
  const colWidths = [80, 100, 80, 60, 50, 50, 80, 70, 70, 80, 100];
  const colPositions = [50];
  
  // Calculate column positions
  for (let i = 1; i < colWidths.length; i++) {
    colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
  }

  const headers = ['Name', 'Email', 'Phone', 'Industry', 'Status', 'Risk', 'Value', 'Start', 'End', 'Contact', 'Data Types'];
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('#374151');
  
  headers.forEach((header, i) => {
    doc.text(header, colPositions[i], tableTop, { width: colWidths[i] });
  });

  // Draw header line
  doc.moveTo(50, tableTop + 15)
     .lineTo(50 + colWidths.reduce((sum, width) => sum + width, 0), tableTop + 15)
     .stroke();

  let currentY = tableTop + 25;

  // Vendor rows
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#1F2937');

  vendors.forEach((vendor, index) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    const dataTypes = vendor.dataTypes.map(dt => 
      dt.dataTypeId ? `${dt.dataTypeId.name} (${dt.dataTypeId.classification})` : 'N/A'
    ).join(', ');

    const rowData = [
      vendor.name || 'N/A',
      vendor.email || 'N/A',
      vendor.phone || 'N/A',
      vendor.industry || 'N/A',
      (vendor.status || 'N/A').toUpperCase(),
      (vendor.riskLevel || 'N/A').toUpperCase(),
      formatCurrency(vendor.contractValue),
      formatDate(vendor.contractStartDate),
      formatDate(vendor.contractEndDate),
      vendor.primaryContact || 'N/A',
      dataTypes || 'None'
    ];

    rowData.forEach((data, i) => {
      // Truncate long text
      const displayText = data.length > 20 ? data.substring(0, 17) + '...' : data;
      doc.text(displayText, colPositions[i], currentY, { width: colWidths[i] });
    });

    currentY += 20;

    // Add separator line every 5 rows
    if ((index + 1) % 5 === 0) {
      doc.moveTo(50, currentY - 5)
         .lineTo(50 + colWidths.reduce((sum, width) => sum + width, 0), currentY - 5)
         .stroke();
    }
  });

  // Footer
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6B7280')
     .text(`Generated on ${exportDate} | VendorTrak Export Report`, 50, doc.page.height - 30, { align: 'center' });

  // Finalize the PDF
  doc.end();
}

module.exports = router;
