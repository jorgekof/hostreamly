const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');
const { LibraryMetadata, UserLibraryAssignment, UserCollection, UserVideo, User } = require('../models');

/**
 * Bunny Stream Multi-Library Service
 * 
 * Manages multiple video libraries with automatic user assignment
 * and collection-based organization for better content management.
 * 
 * Features:
 * - Automatic library assignment based on user location and load balancing
 * - User-specific collections (folders) within libraries
 * - Library health monitoring and load distribution
 * - Automatic failover between libraries
 * - Regional optimization for better performance
 */
class BunnyMultiLibraryService {
  constructor() {
    this.streamApiKey = process.env.BUNNY_STREAM_API_KEY;
    this.cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
    this.webhookSecret = process.env.BUNNY_WEBHOOK_SECRET;
    
    // API endpoints
    this.streamBaseUrl = 'https://video.bunnycdn.com';
    
    // Initialize HTTP client
    this.streamClient = axios.create({
      baseURL: this.streamBaseUrl,
      headers: {
        'AccessKey': this.streamApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    this.setupInterceptors();
    
    // Library regions mapping
    this.regions = {
      'europe': 'EU',
      'us-east': 'US-East',
      'us-west': 'US-West',
      'asia': 'Asia-Pacific',
      'oceania': 'Oceania'
    };
  }

  setupInterceptors() {
    this.streamClient.interceptors.response.use(
      (response) => {
        logger.bunnynet('multi_library_api_success', 'success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        logger.bunnynet('multi_library_api_error', 'error', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        throw error;
      }
    );
  }

  /**
   * Create a new video library in specified region
   */
  async createLibrary(name, region = 'europe') {
    try {
      const response = await this.streamClient.post('/library', {
        Name: name,
        ReplicationRegions: [this.regions[region] || 'EU']
      });
      
      const library = response.data;
      
      // Store library in database
      await this.storeLibraryMetadata(library.Id, {
        name: library.Name,
        region,
        status: 'active',
        createdAt: new Date()
      });
      
      logger.bunnynet('library_created', 'success', {
        libraryId: library.Id,
        name,
        region
      });
      
      return library;
    } catch (error) {
      logger.bunnynet('library_creation_failed', 'error', {
        name,
        region,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all available libraries
   */
  async getLibraries() {
    try {
      const cacheKey = 'bunny:libraries:all';
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const response = await this.streamClient.get('/library');
      const libraries = response.data;
      
      // Enhance with database metadata
      const enhancedLibraries = await Promise.all(
        libraries.map(async (library) => {
          const metadata = await this.getLibraryMetadata(library.Id);
          return {
            ...library,
            metadata
          };
        })
      );
      
      // Cache for 10 minutes
      await cache.set(cacheKey, enhancedLibraries, 600);
      
      return enhancedLibraries;
    } catch (error) {
      logger.bunnynet('get_libraries_failed', 'error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assign user to optimal library based on location and load
   */
  async assignUserToLibrary(userId, userLocation = null) {
    try {
      // Check if user already has an assigned library
      const existingAssignment = await this.getUserLibraryAssignment(userId);
      if (existingAssignment) {
        return existingAssignment;
      }
      
      // Get all active libraries
      const libraries = await this.getLibraries();
      const activeLibraries = libraries.filter(lib => lib.metadata?.status === 'active');
      
      if (activeLibraries.length === 0) {
        throw new Error('No active libraries available');
      }
      
      // Select optimal library based on:
      // 1. User location (if provided)
      // 2. Library load (number of assigned users)
      // 3. Library health status
      let selectedLibrary = await this.selectOptimalLibrary(activeLibraries, userLocation);
      
      // Create user assignment
      await this.createUserLibraryAssignment(userId, selectedLibrary.Id);
      
      // Create user collection if auto-create is enabled
      const settings = await this.getBunnyStreamSettings();
      if (settings.auto_create_collections) {
        await this.createUserCollection(userId, selectedLibrary.Id);
      }
      
      logger.bunnynet('user_library_assigned', 'success', {
        userId,
        libraryId: selectedLibrary.Id,
        libraryName: selectedLibrary.Name
      });
      
      return {
        libraryId: selectedLibrary.Id,
        libraryName: selectedLibrary.Name,
        region: selectedLibrary.metadata?.region
      };
    } catch (error) {
      logger.bunnynet('user_library_assignment_failed', 'error', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a collection (folder) for user within their assigned library
   */
  async createUserCollection(userId, libraryId) {
    try {
      // Get user information
      const user = await User.findByPk(userId, {
        attributes: ['username', 'email']
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const collectionName = `user_${user.username}_${userId}`;
      
      // Check if collection already exists
      const existingCollection = await this.getUserCollection(userId, libraryId);
      if (existingCollection) {
        return existingCollection;
      }
      
      // Create collection via Bunny Stream API
      const response = await this.streamClient.post(`/library/${libraryId}/collections`, {
        name: collectionName
      });
      
      const collection = response.data;
      
      // Store collection metadata
      await this.storeCollectionMetadata(collection.guid, {
        userId,
        libraryId,
        name: collectionName,
        createdAt: new Date()
      });
      
      // Create default subfolders for better organization
      await this.createDefaultSubfolders(collection.guid, libraryId);
      
      logger.bunnynet('user_collection_created', 'success', {
        userId,
        libraryId,
        collectionId: collection.guid,
        collectionName
      });
      
      return collection;
    } catch (error) {
      logger.bunnynet('user_collection_creation_failed', 'error', {
        userId,
        libraryId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create default subfolders within a user collection
   */
  async createDefaultSubfolders(parentCollectionId, libraryId) {
    const defaultFolders = [
      { name: 'Videos', description: 'User uploaded videos' },
      { name: 'Livestreams', description: 'Recorded livestreams' },
      { name: 'Thumbnails', description: 'Video thumbnails and covers' },
      { name: 'Archive', description: 'Archived content' }
    ];

    try {
      for (const folder of defaultFolders) {
        await this.streamClient.post(`/library/${libraryId}/collections`, {
          name: folder.name,
          parentId: parentCollectionId
        });
      }
      
      logger.bunnynet('default_subfolders_created', 'success', {
        parentCollectionId,
        libraryId,
        foldersCount: defaultFolders.length
      });
    } catch (error) {
      logger.bunnynet('default_subfolders_creation_failed', 'error', {
        parentCollectionId,
        libraryId,
        error: error.message
      });
      // Don't throw error as this is not critical
    }
  }

  /**
   * Create a custom subfolder within user's collection
   */
  async createUserSubfolder(userId, libraryId, folderName, parentCollectionId = null) {
    try {
      // Get user's main collection if no parent specified
      if (!parentCollectionId) {
        const userCollection = await this.getUserCollection(userId, libraryId);
        if (!userCollection) {
          throw new Error('User collection not found');
        }
        parentCollectionId = userCollection.collection_id;
      }

      // Create subfolder via Bunny Stream API
      const response = await this.streamClient.post(`/library/${libraryId}/collections`, {
        name: folderName,
        parentId: parentCollectionId
      });

      const subfolder = response.data;

      logger.bunnynet('user_subfolder_created', 'success', {
        userId,
        libraryId,
        parentCollectionId,
        subfolderName: folderName,
        subfolderId: subfolder.guid
      });

      return subfolder;
    } catch (error) {
      logger.bunnynet('user_subfolder_creation_failed', 'error', {
        userId,
        libraryId,
        folderName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user's folder structure
   */
  async getUserFolderStructure(userId, libraryId) {
    try {
      const userCollection = await this.getUserCollection(userId, libraryId);
      if (!userCollection) {
        return null;
      }

      // Get all collections in the library
      const response = await this.streamClient.get(`/library/${libraryId}/collections`);
      const allCollections = response.data.items || [];

      // Filter collections that belong to this user
      const userCollections = allCollections.filter(collection => 
        collection.guid === userCollection.collection_id ||
        this.isChildCollection(collection, userCollection.collection_id, allCollections)
      );

      // Build hierarchical structure
      const structure = this.buildFolderHierarchy(userCollections, userCollection.collection_id);

      return structure;
    } catch (error) {
      logger.bunnynet('get_user_folder_structure_failed', 'error', {
        userId,
        libraryId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if a collection is a child of a parent collection
   */
  isChildCollection(collection, parentId, allCollections) {
    if (collection.parentId === parentId) {
      return true;
    }
    
    // Check if it's a nested child
    const parent = allCollections.find(c => c.guid === collection.parentId);
    if (parent && parent.parentId) {
      return this.isChildCollection(parent, parentId, allCollections);
    }
    
    return false;
  }

  /**
   * Build hierarchical folder structure
   */
  buildFolderHierarchy(collections, rootId) {
    const root = collections.find(c => c.guid === rootId);
    if (!root) return null;

    const children = collections
      .filter(c => c.parentId === rootId)
      .map(child => this.buildFolderHierarchy(collections, child.guid))
      .filter(Boolean);

    return {
      id: root.guid,
      name: root.name,
      videoCount: root.videoCount || 0,
      children: children
    };
  }

  /**
   * Get user's collection within their assigned library
   */
  async getUserCollection(userId, libraryId) {
    try {
      const result = await UserCollection.findOne({
        where: {
          user_id: userId,
          library_id: libraryId
        }
      });
      
      return result ? result.toJSON() : null;
    } catch (error) {
      logger.bunnynet('get_user_collection_failed', 'error', {
        userId,
        libraryId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Select optimal library based on various factors
   */
  async selectOptimalLibrary(libraries, userLocation) {
    // Simple load balancing - select library with least users
    // In production, this could be enhanced with:
    // - Geographic proximity
    // - Library performance metrics
    // - Storage usage
    // - Network latency
    
    const libraryLoads = await Promise.all(
      libraries.map(async (library) => {
        const userCount = await this.getLibraryUserCount(library.Id);
        return {
          ...library,
          userCount
        };
      })
    );
    
    // Sort by user count (ascending) and select the least loaded
    libraryLoads.sort((a, b) => a.userCount - b.userCount);
    
    return libraryLoads[0];
  }

  /**
   * Get number of users assigned to a library
   */
  async getLibraryUserCount(libraryId) {
    try {
      const count = await UserLibraryAssignment.count({
        where: {
          library_id: libraryId,
          is_active: true
        }
      });
      
      return count || 0;
    } catch (error) {
      logger.bunnynet('get_library_user_count_failed', 'error', {
        libraryId,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Get user's library assignment
   */
  async getUserLibraryAssignment(userId) {
    try {
      const result = await UserLibraryAssignment.findOne({
        where: {
          user_id: userId,
          is_active: true
        },
        include: [{
          model: LibraryMetadata,
          as: 'library',
          attributes: ['library_name', 'region']
        }]
      });
      
      if (result) {
        return {
          libraryId: result.library_id,
          libraryName: result.library?.library_name,
          region: result.library?.region,
          assignedAt: result.assigned_at
        };
      }
      
      return null;
    } catch (error) {
      logger.bunnynet('get_user_library_assignment_failed', 'error', {
        userId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Create video in user's assigned library and collection
   */
  async createUserVideo(userId, title, metadata = {}) {
    try {
      // Get user's library assignment
      const assignment = await this.assignUserToLibrary(userId);
      
      // Get user's collection
      const collection = await this.getUserCollection(userId, assignment.libraryId);
      
      // Create video in the assigned library and collection
      const response = await this.streamClient.post(`/library/${assignment.libraryId}/videos`, {
        title,
        collectionId: collection?.collection_id || null,
        ...metadata
      });
      
      const video = response.data;
      
      // Store video metadata
      await this.storeVideoMetadata(video.guid, {
        userId,
        libraryId: assignment.libraryId,
        collectionId: collection?.collection_id,
        title,
        status: video.status,
        createdAt: new Date()
      });
      
      logger.bunnynet('user_video_created', 'success', {
        userId,
        videoId: video.guid,
        libraryId: assignment.libraryId,
        title
      });
      
      return {
        ...video,
        libraryId: assignment.libraryId,
        collectionId: collection?.collection_id
      };
    } catch (error) {
      logger.bunnynet('user_video_creation_failed', 'error', {
        userId,
        title,
        error: error.message
      });
      throw error;
    }
  }

  // Database helper methods
  
  async storeLibraryMetadata(libraryId, metadata) {
    await LibraryMetadata.upsert({
      library_id: libraryId,
      library_name: metadata.name,
      region: metadata.region,
      is_active: metadata.status === 'active',
      health_status: 'healthy'
    });
  }
  
  async getLibraryMetadata(libraryId) {
    const result = await LibraryMetadata.findOne({
      where: { library_id: libraryId }
    });
    
    return result ? result.toJSON() : null;
  }
  
  async createUserLibraryAssignment(userId, libraryId) {
    await UserLibraryAssignment.create({
      user_id: userId,
      library_id: libraryId,
      is_active: true
    });
  }
  
  async storeCollectionMetadata(collectionId, metadata) {
    await UserCollection.create({
      collection_id: collectionId,
      user_id: metadata.userId,
      library_id: metadata.libraryId,
      collection_name: metadata.name,
      is_default: true,
      video_count: 0,
      total_size_bytes: 0
    });
  }
  
  async storeVideoMetadata(videoId, metadata) {
    await UserVideo.create({
      video_id: videoId,
      bunny_video_id: videoId,
      user_id: metadata.userId,
      library_id: metadata.libraryId,
      collection_id: metadata.collectionId,
      title: metadata.title,
      status: metadata.status || 'processing',
      upload_progress: 0,
      encoding_progress: 0,
      views_count: 0
    });
  }
  
  async getBunnyStreamSettings() {
    try {
      // For now, return default settings since we don't have a SystemConfig model yet
      // This can be enhanced later with a proper system configuration model
      return {
        enable_multiple_libraries: true,
        auto_create_collections: true,
        default_library_region: 'europe'
      };
    } catch (error) {
      logger.bunnynet('get_bunny_stream_settings_failed', 'error', {
        error: error.message
      });
      return {
        enable_multiple_libraries: false,
        auto_create_collections: false,
        default_library_region: 'europe'
      };
    }
  }
}

module.exports = new BunnyMultiLibraryService();