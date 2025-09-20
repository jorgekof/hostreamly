const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [1, 255],
        msg: 'Title must be between 1 and 255 characters'
      }
    },
    set(value) {
      this.setDataValue('title', value.trim());
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 5000],
        msg: 'Description cannot exceed 5000 characters'
      }
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug can only contain lowercase letters, numbers, and hyphens'
      }
    }
  },
  bunny_video_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Bunny.net Stream video ID'
  },
  bunny_library_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Bunny.net Stream library ID'
  },
  bunny_collection_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Bunny.net Stream collection ID'
  },
  original_filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'File size must be greater than 0'
      }
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fps: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  bitrate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Bitrate in kbps'
  },
  codec: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  format: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preview_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hls_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HLS streaming URL'
  },
  dash_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'DASH streaming URL'
  },
  mp4_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Direct MP4 URL'
  },
  embed_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Bunny Stream embed URL'
  },
  play_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Bunny Stream direct play URL'
  },
  status: {
    type: DataTypes.ENUM(
      'uploading',
      'processing',
      'ready',
      'failed',
      'deleted'
    ),
    defaultValue: 'uploading',
    allowNull: false
  },
  processing_progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  visibility: {
    type: DataTypes.ENUM('public', 'unlisted', 'private'),
    defaultValue: 'private',
    allowNull: false
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Requires premium subscription to view'
  },
  drm_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  drm_key_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'DRM encryption key ID'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false
  },
  categories: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false
  },
  view_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  dislike_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  share_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  bandwidth_used: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total bandwidth used in bytes'
  },
  last_viewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scheduled_publish_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Auto-delete date for temporary videos'
  },
  allow_comments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  allow_downloads: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  allow_embedding: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  password_protected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  geo_restrictions: {
    type: DataTypes.JSON,
    defaultValue: null,
    allowNull: true,
    comment: 'Array of allowed/blocked country codes'
  },
  analytics_data: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: false
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if processing failed'
  }
}, {
  tableName: 'videos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      unique: true,
      fields: ['slug']
    },
    {
      unique: true,
      fields: ['bunny_video_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['visibility']
    },
    {
      fields: ['is_premium']
    },
    {
      fields: ['published_at']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['view_count']
    },
    {
      fields: ['tags'],
      using: 'gin'
    },
    {
      fields: ['categories'],
      using: 'gin'
    }
  ],
  hooks: {
    beforeCreate: (video) => {
      // Generate slug if not provided
      if (!video.slug) {
        video.slug = video.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
        
        // Add timestamp to ensure uniqueness
        video.slug += '-' + Date.now();
      }
    },
    afterCreate: (video) => {
      logger.audit('video_created', video.user_id, 'video', {
        videoId: video.id,
        title: video.title,
        bunnyVideoId: video.bunny_video_id
      });
    },
    afterUpdate: (video) => {
      if (video.changed()) {
        logger.audit('video_updated', video.user_id, 'video', {
          videoId: video.id,
          changes: video.changed()
        });
      }
    },
    afterDestroy: (video) => {
      logger.audit('video_deleted', video.user_id, 'video', {
        videoId: video.id,
        title: video.title,
        bunnyVideoId: video.bunny_video_id
      });
    }
  }
});

// Instance methods
Video.prototype.isPublished = function() {
  return this.status === 'ready' && 
         this.visibility !== 'private' && 
         (!this.published_at || this.published_at <= new Date());
};

Video.prototype.isAccessible = function(user = null) {
  // Check if video is ready
  if (this.status !== 'ready') return false;
  
  // Check visibility
  if (this.visibility === 'private') {
    return user && (user.id === this.user_id || user.role === 'admin');
  }
  
  // Check premium requirement
  if (this.is_premium) {
    return user && (user.isPremiumActive() || user.role === 'admin');
  }
  
  // Check publish date
  if (this.published_at && this.published_at > new Date()) {
    return user && (user.id === this.user_id || user.role === 'admin');
  }
  
  return true;
};

Video.prototype.incrementView = async function() {
  await this.increment('view_count');
  await this.update({ last_viewed_at: new Date() });
};

Video.prototype.incrementDownload = async function() {
  await this.increment('download_count');
};

Video.prototype.incrementShare = async function() {
  await this.increment('share_count');
};

Video.prototype.addBandwidthUsage = async function(bytes) {
  await this.increment('bandwidth_used', { by: bytes });
};

Video.prototype.getStreamingUrls = function() {
  return {
    hls: this.hls_url,
    dash: this.dash_url,
    mp4: this.mp4_url,
    thumbnail: this.thumbnail_url,
    preview: this.preview_url
  };
};

Video.prototype.getAnalytics = function() {
  return {
    views: this.view_count,
    likes: this.like_count,
    dislikes: this.dislike_count,
    comments: this.comment_count,
    downloads: this.download_count,
    shares: this.share_count,
    bandwidth: this.bandwidth_used,
    lastViewed: this.last_viewed_at
  };
};

Video.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Remove sensitive fields
  delete values.password_hash;
  delete values.drm_key_id;
  
  return values;
};

// Class methods
Video.findBySlug = function(slug) {
  return this.findOne({
    where: { slug },
    include: [{
      model: require('./User'),
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }]
  });
};

Video.findByBunnyId = function(bunnyVideoId) {
  return this.findOne({
    where: { bunny_video_id: bunnyVideoId }
  });
};

Video.getPublicVideos = function(limit = 20, offset = 0, orderBy = 'created_at', orderDir = 'DESC') {
  const { Op } = require('sequelize');
  
  return this.findAndCountAll({
    where: {
      status: 'ready',
      visibility: 'public',
      [Op.or]: [
        { published_at: null },
        { published_at: { [Op.lte]: new Date() } }
      ]
    },
    include: [{
      model: require('./User'),
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    limit,
    offset,
    order: [[orderBy, orderDir]]
  });
};

Video.getUserVideos = function(userId, limit = 20, offset = 0) {
  return this.findAndCountAll({
    where: { user_id: userId },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

Video.searchVideos = function(query, limit = 20, offset = 0) {
  const { Op } = require('sequelize');
  
  return this.findAndCountAll({
    where: {
      status: 'ready',
      visibility: 'public',
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query] } }
      ],
      [Op.or]: [
        { published_at: null },
        { published_at: { [Op.lte]: new Date() } }
      ]
    },
    include: [{
      model: require('./User'),
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    limit,
    offset,
    order: [['view_count', 'DESC']]
  });
};

Video.getPopularVideos = function(limit = 20, days = 7) {
  const { Op } = require('sequelize');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      status: 'ready',
      visibility: 'public',
      created_at: { [Op.gte]: since },
      [Op.or]: [
        { published_at: null },
        { published_at: { [Op.lte]: new Date() } }
      ]
    },
    include: [{
      model: require('./User'),
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    limit,
    order: [['view_count', 'DESC']]
  });
};

// Define associations
Video.associate = function(models) {
  Video.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = Video;