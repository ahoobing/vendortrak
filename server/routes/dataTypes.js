const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const DataType = require('../models/DataType');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/data-types/classifications - Get all available classifications (public endpoint)
router.get('/classifications', (req, res) => {
  const classifications = [
    'Personal Data',
    'Sensitive Personal Data',
    'Financial Data',
    'Health Data',
    'Business Data',
    'Technical Data',
    'Legal Data',
    'Other'
  ];
  res.json({ classifications });
});

// Apply authentication to all other routes
router.use(authenticateToken);

// Validation middleware
const validateDataType = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('classification')
    .isIn([
      'Personal Data',
      'Sensitive Personal Data',
      'Financial Data',
      'Health Data',
      'Business Data',
      'Technical Data',
      'Legal Data',
      'Other'
    ])
    .withMessage('Invalid classification'),

  body('riskLevel')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid risk level'),
  body('complianceRequirements')
    .optional()
    .isArray()
    .withMessage('Compliance requirements must be an array'),
  body('complianceRequirements.*')
    .optional()
    .isIn([
      'GDPR',
      'CCPA',
      'HIPAA',
      'SOX',
      'PCI-DSS',
      'FERPA',
      'GLBA',
      'Other'
    ])
    .withMessage('Invalid compliance requirement'),
  body('retentionPeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Retention period must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// GET /api/data-types - Get all data types with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().custom((value) => {
    if (value !== undefined && value !== null && value !== '' && value.length < 1) {
      throw new Error('Search query must not be empty');
    }
    return true;
  }),
  query('classification').optional().isIn([
    'Personal Data',
    'Sensitive Personal Data',
    'Financial Data',
    'Health Data',
    'Business Data',
    'Technical Data',
    'Legal Data',
    'Other'
  ]).withMessage('Invalid classification filter'),
  query('riskLevel').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid risk level filter'),

  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive filter must be true or false'),
  query('sortBy').optional().isIn(['name', 'classification', 'riskLevel', 'createdAt', 'updatedAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      search,
      classification,
      riskLevel,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { tenantId: req.tenant._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (classification) query.classification = classification;
    if (riskLevel) query.riskLevel = riskLevel;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const dataTypes = await DataType.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    const total = await DataType.countDocuments(query);

    res.json({
      dataTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching data types:', error);
    res.status(500).json({ error: 'Failed to fetch data types' });
  }
});





// GET /api/data-types/stats - Get statistics for data types
router.get('/stats', async (req, res) => {
  try {
    const stats = await DataType.aggregate([
      { $match: { tenantId: req.tenant._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          byClassification: {
            $push: '$classification'
          },
          byRiskLevel: {
            $push: '$riskLevel'
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          active: 1,
          inactive: 1,
          classificationCounts: {
            $reduce: {
              input: '$byClassification',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $literal: { '$$this': { $add: [{ $ifNull: [{ $arrayElemAt: ['$$value.$$this', 0] }, 0] }, 1] } } }
                ]
              }
            }
          },
          riskLevelCounts: {
            $reduce: {
              input: '$byRiskLevel',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $literal: { '$$this': { $add: [{ $ifNull: [{ $arrayElemAt: ['$$value.$$this', 0] }, 0] }, 1] } } }
                ]
              }
            }
          }
        }
      }
    ]);

    res.json({ stats: stats[0] || { total: 0, active: 0, inactive: 0, classificationCounts: {}, riskLevelCounts: {} } });
  } catch (error) {
    console.error('Error fetching data type stats:', error);
    res.status(500).json({ error: 'Failed to fetch data type statistics' });
  }
});

// GET /api/data-types/:id - Get a specific data type
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid data type ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dataType = await DataType.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    }).populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!dataType) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    res.json({ dataType });
  } catch (error) {
    console.error('Error fetching data type:', error);
    res.status(500).json({ error: 'Failed to fetch data type' });
  }
});

// POST /api/data-types - Create a new data type
router.post('/', validateDataType, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if data type with same name already exists for this tenant
    const existingDataType = await DataType.findOne({
      name: req.body.name,
      tenantId: req.tenant._id
    });

    if (existingDataType) {
      return res.status(400).json({ error: 'A data type with this name already exists' });
    }

    const dataType = new DataType({
      ...req.body,
      tenantId: req.tenant._id,
      createdBy: req.user._id
    });

    await dataType.save();
    await dataType.populate('createdBy', 'firstName lastName email');

    res.status(201).json({ dataType });
  } catch (error) {
    console.error('Error creating data type:', error);
    res.status(500).json({ error: 'Failed to create data type' });
  }
});

// PUT /api/data-types/:id - Update a data type
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid data type ID'),
  ...validateDataType
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if data type exists and belongs to tenant
    const existingDataType = await DataType.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!existingDataType) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    // Check if name is being changed and if it conflicts with another data type
    if (req.body.name && req.body.name !== existingDataType.name) {
      const nameConflict = await DataType.findOne({
        name: req.body.name,
        tenantId: req.tenant._id,
        _id: { $ne: req.params.id }
      });

      if (nameConflict) {
        return res.status(400).json({ error: 'A data type with this name already exists' });
      }
    }

    // Update the data type
    const updatedDataType = await DataType.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email');

    res.json({ dataType: updatedDataType });
  } catch (error) {
    console.error('Error updating data type:', error);
    res.status(500).json({ error: 'Failed to update data type' });
  }
});

// DELETE /api/data-types/:id - Delete a data type
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid data type ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dataType = await DataType.findOne({
      _id: req.params.id,
      tenantId: req.tenant._id
    });

    if (!dataType) {
      return res.status(404).json({ error: 'Data type not found' });
    }

    // Check if data type is being used by any vendors
    const Vendor = require('../models/Vendor');
    const vendorsUsingDataType = await Vendor.findOne({
      tenantId: req.tenant._id,
      dataTypes: req.params.id
    });

    if (vendorsUsingDataType) {
      return res.status(400).json({ 
        error: 'Cannot delete data type. It is currently assigned to one or more vendors.' 
      });
    }

    await DataType.findByIdAndDelete(req.params.id);

    res.json({ message: 'Data type deleted successfully' });
  } catch (error) {
    console.error('Error deleting data type:', error);
    res.status(500).json({ error: 'Failed to delete data type' });
  }
});

module.exports = router;
