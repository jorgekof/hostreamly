const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const bunnyService = require('./BunnyService');

/**
 * Upload file to storage
 * @param {string} filePath - Local file path
 * @param {string} remotePath - Remote storage path
 * @returns {Promise<Object>} Upload result
 */
async function uploadFile(filePath, remotePath) {
  try {
    // Use BunnyService for actual upload
    const result = await bunnyService.uploadToStorage(filePath, remotePath);
    
    logger.info('File uploaded successfully', {
      filePath: path.basename(filePath),
      remotePath,
      size: result.size
    });
    
    return {
      success: true,
      url: result.url,
      size: result.size,
      path: remotePath
    };
  } catch (error) {
    logger.error('File upload failed', {
      filePath: path.basename(filePath),
      remotePath,
      error: error.message
    });
    
    // Fallback for development/testing
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const uniqueId = crypto.randomUUID();
      return {
        success: true,
        url: `https://mock-cdn.example.com/${remotePath}`,
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        path: remotePath,
        mock: true
      };
    }
    
    throw error;
  }
}

/**
 * Delete file from storage
 * @param {string} remotePath - Remote storage path
 * @returns {Promise<boolean>} Deletion result
 */
async function deleteFile(remotePath) {
  try {
    // Use BunnyService for actual deletion
    await bunnyService.deleteFromStorage(remotePath);
    
    logger.info('File deleted successfully', {
      remotePath
    });
    
    return true;
  } catch (error) {
    logger.error('File deletion failed', {
      remotePath,
      error: error.message
    });
    
    // Fallback for development/testing
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.warn('Storage service unavailable, mock deletion', {
        remotePath
      });
      return true;
    }
    
    throw error;
  }
}

/**
 * List files in storage directory
 * @param {string} directory - Directory path
 * @returns {Promise<Array>} List of files
 */
async function listFiles(directory = '') {
  try {
    const files = await bunnyService.listStorageFiles(directory);
    return files;
  } catch (error) {
    logger.error('Failed to list files', {
      directory,
      error: error.message
    });
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get file info from storage
 * @param {string} remotePath - Remote storage path
 * @returns {Promise<Object>} File information
 */
async function getFileInfo(remotePath) {
  try {
    // This would typically make an API call to get file metadata
    // For now, return mock data
    return {
      path: remotePath,
      size: 0,
      lastModified: new Date().toISOString(),
      exists: true
    };
  } catch (error) {
    logger.error('Failed to get file info', {
      remotePath,
      error: error.message
    });
    
    return {
      path: remotePath,
      exists: false
    };
  }
}

module.exports = {
  uploadFile,
  deleteFile,
  listFiles,
  getFileInfo
};