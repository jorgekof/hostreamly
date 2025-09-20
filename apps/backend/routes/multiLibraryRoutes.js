const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const rateLimit = require('express-rate-limit');
const bunnyMultiLibraryService = require('../services/BunnyMultiLibraryService');
const logger = require('../utils/logger');

// Rate limiting for library operations
const libraryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many library requests from this IP, please try again later.'
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route GET /api/multi-library/libraries
 * @desc Get all libraries (admin only)
 * @access Private/Admin
 */
router.get('/libraries', 
  auth, 
  adminAuth, 
  async (req, res) => {
    try {
      const libraries = await bunnyMultiLibraryService.getLibraries();
      
      res.json({
        success: true,
        data: libraries
      });
    } catch (error) {
      logger.error('Get libraries failed', {
        error: error.message,
        userId: req.user.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve libraries'
      });
    }
  }
);

/**
 * @route POST /api/multi-library/libraries
 * @desc Create a new library (admin only)
 * @access Private/Admin
 */
router.post('/libraries',
  auth,
  adminAuth,
  libraryRateLimit,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Library name must be between 1 and 255 characters'),
    body('region')
      .isIn(['europe', 'us-east', 'us-west', 'asia', 'oceania'])
      .withMessage('Invalid region specified')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, region } = req.body;
      
      const library = await bunnyMultiLibraryService.createLibrary(name, region);
      
      logger.info('Library created', {
        libraryId: library.Id,
        name,
        region,
        createdBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: 'Library created successfully',
        data: library
      });
    } catch (error) {
      logger.error('Library creation failed', {
        error: error.message,
        name: req.body.name,
        region: req.body.region,
        userId: req.user.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create library'
      });
    }
  }
);

/**
 * @route GET /api/multi-library/user/assignment
 * @desc Get current user's library assignment
 * @access Private
 */
router.get('/user/assignment',
  auth,
  async (req, res) => {
    try {
      const assignment = await bunnyMultiLibraryService.getUserLibraryAssignment(req.user.id);
      
      if (!assignment) {
        return res.json({
          success: true,
          data: null,
          message: 'No library assigned yet'
        });
      }
      
      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      logger.error('Get user library assignment failed', {
        error: error.message,
        userId: req.user.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve library assignment'
      });
    }
  }
);

/**
 * @route POST /api/multi-library/user/assign
 * @desc Assign user to optimal library
 * @access Private
 */
router.post('/user/assign',
  auth,
  [
    body('userLocation')
      .optional()
      .isString()
      .withMessage('User location must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userLocation } = req.body;
      
      const assignment = await bunnyMultiLibraryService.assignUserToLibrary(
        req.user.id, 
        userLocation
      );
      
      res.json({
        success: true,
        message: 'Library assigned successfully',
        data: assignment
      });
    } catch (error) {
      logger.error('User library assignment failed', {
        error: error.message,
        userId: req.user.id,
        userLocation: req.body.userLocation
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to assign library'
      });
    }
  }
);

/**
 * @route GET /api/multi-library/user/collection
 * @desc Get user's collection in their assigned library
 * @access Private
 */
router.get('/user/collection',
  auth,
  async (req, res) => {
    try {
      // Get user's library assignment first
      const assignment = await bunnyMultiLibraryService.getUserLibraryAssignment(req.user.id);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'No library assigned to user'
        });
      }
      
      const collection = await bunnyMultiLibraryService.getUserCollection(
        req.user.id, 
        assignment.libraryId
      );
      
      res.json({
        success: true,
        data: collection
      });
    } catch (error) {
      logger.error('Get user collection failed', {
        error: error.message,
        userId: req.user.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user collection'
      });
    }
  }
);

/**
 * @route POST /api/multi-library/user/collection
 * @desc Create collection for user in their assigned library
 * @access Private
 */
router.post('/user/collection',
  auth,
  async (req, res) => {
    try {
      // Get user's library assignment first
      const assignment = await bunnyMultiLibraryService.getUserLibraryAssignment(req.user.id);
      
      if (!assignment) {
        // Auto-assign user to a library if not assigned
        const newAssignment = await bunnyMultiLibraryService.assignUserToLibrary(req.user.id);
        assignment = newAssignment;
      }
      
      const collection = await bunnyMultiLibraryService.createUserCollection(
        req.user.id, 
        assignment.libraryId
      );
      
      res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        data: collection
      });
    } catch (error) {
      logger.error('Create user collection failed', {
        error: error.message,
        userId: req.user.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create user collection'
      });
    }
  }
);

/**
 * @route POST /api/multi-library/user/videos
 * @desc Create video in user's assigned library and collection
 * @access Private
 */
router.post('/user/videos',
  auth,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Video title must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, description } = req.body;
      
      const video = await bunnyMultiLibraryService.createUserVideo(
        req.user.id,
        title,
        { description }
      );
      
      res.status(201).json({
        success: true,
        message: 'Video created successfully',
        data: video
      });
    } catch (error) {
      logger.error('Create user video failed', {
        error: error.message,
        userId: req.user.id,
        title: req.body.title
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create video'
      });
    }
  }
);

/**
 * @route GET /api/multi-library/user/folders
 * @desc Get user's folder structure
 * @access Private
 */
router.get('/user/folders',
  auth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user's library assignment
      const assignment = await bunnyMultiLibraryService.getUserLibraryAssignment(userId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'User is not assigned to any library'
        });
      }
      
      const folderStructure = await bunnyMultiLibraryService.getUserFolderStructure(
         userId, 
         assignment.library_id
       );
      
      res.json({
        success: true,
        data: folderStructure
      });
    } catch (error) {
      logger.error('Get user folders failed', {
        userId: req.user.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get folder structure'
      });
    }
  }
);

/**
 * @route POST /api/multi-library/user/folders
 * @desc Create a custom subfolder for user
 * @access Private
 */
router.post('/user/folders',
  auth,
  [
    body('folderName')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Folder name must be between 1 and 100 characters'),
    body('parentFolderId')
      .optional()
      .isString()
      .withMessage('Parent folder ID must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { folderName, parentFolderId } = req.body;
      const userId = req.user.id;
      
      // Get user's library assignment
      const assignment = await bunnyMultiLibraryService.getUserLibraryAssignment(userId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'User is not assigned to any library'
        });
      }
      
      const subfolder = await bunnyMultiLibraryService.createUserSubfolder(
         userId,
         assignment.library_id,
         folderName,
         parentFolderId
       );
      
      res.status(201).json({
        success: true,
        message: 'Subfolder created successfully',
        data: subfolder
      });
    } catch (error) {
      logger.error('Create user subfolder failed', {
        userId: req.user.id,
        folderName: req.body.folderName,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create subfolder'
      });
    }
  }
);

/**
 * @route GET /api/multi-library/stats
 * @desc Get multi-library statistics (admin only)
 * @access Private/Admin
 */
router.get('/stats',
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const libraries = await bunnyMultiLibraryService.getLibraries();
      
      const stats = {
        totalLibraries: libraries.length,
        activeLibraries: libraries.filter(lib => lib.metadata?.status === 'active').length,
        libraryStats: await Promise.all(
          libraries.map(async (library) => {
            const userCount = await bunnyMultiLibraryService.getLibraryUserCount(library.Id);
            return {
              libraryId: library.Id,
              name: library.Name,
              region: library.metadata?.region,
              status: library.metadata?.status,
              userCount,
              storageUsed: library.metadata?.storage_used || 0,
              bandwidthUsed: library.metadata?.bandwidth_used || 0
            };
          })
        )
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get multi-library stats failed', {
        error: error.message,
        userId: req.user.id
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics'
      });
    }
  }
);

module.exports = router;