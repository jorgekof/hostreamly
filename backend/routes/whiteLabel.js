const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const whiteLabelController = require('../controllers/whiteLabelController');
const { authMiddleware } = require('../middleware/auth');
const { validatePlan } = require('../middleware/planValidation');
const { 
  handleValidationErrors, 
  sanitizeHtml, 
  validateSecureUrl,
  validateCustomCSS,
  createSmartRateLimit 
} = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images for assets
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate limiting mejorado
const generalLimit = createSmartRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  prefix: 'whitelabel_general',
  skipAdmin: true
});

const uploadLimit = createSmartRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Upload limit exceeded, please try again later',
  prefix: 'whitelabel_upload',
  skipAdmin: true
});

const domainLimit = createSmartRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 domain operations per hour
  message: 'Domain operation limit exceeded, please try again later',
  prefix: 'whitelabel_domain',
  skipAdmin: true
});

// Validation rules mejoradas con sanitización XSS
const configValidation = [
  body('company_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name must be between 1 and 100 characters'),
  sanitizeHtml('company_name'), // Sanitizar XSS
  body('primary_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Primary color must be a valid hex color'),
  body('secondary_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Secondary color must be a valid hex color'),
  body('accent_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Accent color must be a valid hex color'),
  body('background_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Background color must be a valid hex color'),
  body('text_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Text color must be a valid hex color'),
  body('custom_domain')
    .optional()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/)
    .withMessage('Invalid domain format'),
  validateCustomCSS('custom_css', { maxLength: 10000 }) // Validación segura de CSS
];

const domainValidation = [
  body('domain')
    .notEmpty()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/)
    .withMessage('Invalid domain format')
    .custom(async (domain) => {
      // Verificar que no sea un dominio privado o localhost
      const privateDomains = ['localhost', '127.0.0.1', '0.0.0.0', 'local'];
      if (privateDomains.some(pd => domain.includes(pd))) {
        throw new Error('Private domains are not allowed');
      }
      return true;
    }),
  body('subdomain')
    .optional()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/)
    .withMessage('Invalid subdomain format'),
  sanitizeHtml('subdomain') // Sanitizar XSS
];

const assetValidation = [
  body('asset_type')
    .notEmpty()
    .isIn(['logo', 'favicon', 'watermark', 'background', 'banner'])
    .withMessage('Invalid asset type')
];

// Apply authentication and plan validation to all routes
router.use(authMiddleware);
router.use(validatePlan(['Professional', 'Enterprise'])); // White label requires Professional or Enterprise plan

// Routes

/**
 * @swagger
 * /api/white-label/config:
 *   get:
 *     summary: Get white label configuration
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: White label configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     company_name:
 *                       type: string
 *                     primary_color:
 *                       type: string
 *                     secondary_color:
 *                       type: string
 *                     accent_color:
 *                       type: string
 *                     background_color:
 *                       type: string
 *                     text_color:
 *                       type: string
 *                     custom_domain:
 *                       type: string
 *                     domain_verified:
 *                       type: boolean
 *                     custom_css:
 *                       type: string
 *                     branding_settings:
 *                       type: object
 *                     player_settings:
 *                       type: object
 *                     assets:
 *                       type: array
 *                     domains:
 *                       type: array
 */
router.get('/config', generalLimit, whiteLabelController.getConfig);

/**
 * @swagger
 * /api/white-label/config:
 *   put:
 *     summary: Update white label configuration
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               primary_color:
 *                 type: string
 *               secondary_color:
 *                 type: string
 *               accent_color:
 *                 type: string
 *               background_color:
 *                 type: string
 *               text_color:
 *                 type: string
 *               custom_domain:
 *                 type: string
 *               custom_css:
 *                 type: string
 *               branding_settings:
 *                 type: object
 *               player_settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.put('/config', generalLimit, configValidation, handleValidationErrors, whiteLabelController.updateConfig);

/**
 * @swagger
 * /api/white-label/assets:
 *   post:
 *     summary: Upload white label asset
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               asset_type:
 *                 type: string
 *                 enum: [logo, favicon, watermark, background, banner]
 *     responses:
 *       200:
 *         description: Asset uploaded successfully
 */
router.post('/assets', uploadLimit, upload.single('file'), assetValidation, handleValidationErrors, whiteLabelController.uploadAsset);

/**
 * @swagger
 * /api/white-label/assets/{assetId}:
 *   delete:
 *     summary: Delete white label asset
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 */
router.delete('/assets/:assetId', generalLimit, whiteLabelController.deleteAsset);

/**
 * @swagger
 * /api/white-label/domains:
 *   post:
 *     summary: Setup custom domain
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *               subdomain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Domain setup initiated successfully
 */
router.post('/domains', domainLimit, domainValidation, handleValidationErrors, whiteLabelController.setupCustomDomain);

/**
 * @swagger
 * /api/white-label/domains:
 *   get:
 *     summary: Get custom domains
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Custom domains retrieved successfully
 */
router.get('/domains', generalLimit, whiteLabelController.getCustomDomains);

/**
 * @swagger
 * /api/white-label/domains/{domain}/verify:
 *   post:
 *     summary: Verify custom domain
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Domain verification result
 */
router.post('/domains/:domain/verify', domainLimit, whiteLabelController.verifyCustomDomain);

/**
 * @swagger
 * /api/white-label/css:
 *   get:
 *     summary: Generate CSS for white label configuration
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSS generated successfully
 *         content:
 *           text/css:
 *             schema:
 *               type: string
 */
router.get('/css', generalLimit, whiteLabelController.generateCSS);

/**
 * @swagger
 * /api/white-label/themes:
 *   get:
 *     summary: Get available themes
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Themes retrieved successfully
 */
router.get('/themes', generalLimit, whiteLabelController.getThemes);

/**
 * @swagger
 * /api/white-label/themes/{themeId}/apply:
 *   post:
 *     summary: Apply theme to configuration
 *     tags: [White Label]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Theme applied successfully
 */
router.post('/themes/:themeId/apply', generalLimit, whiteLabelController.applyTheme);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed'
    });
  }
  
  next(error);
});

module.exports = router;