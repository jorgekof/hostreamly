const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const logger = require('../utils/logger');
const crypto = require('crypto');

const LiveStream = sequelize.define('LiveStream', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Basic Information
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  slug: {
    type: DataTypes.STRING(300),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  
  // Agora Configuration
  channel_name: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-zA-Z0-9_-]{1,64}$/
    }
  },
  
  agora_app_id: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  
  broadcaster_uid: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  
  // Stream Status
  status: {
    type: DataTypes.ENUM(
      'scheduled',    // Stream is scheduled but not started
      'preparing',    // Stream is being prepared
      'live',         // Stream is currently live
      'paused',       // Stream is temporarily paused
      'ended',        // Stream has ended
      'cancelled',    // Stream was cancelled
      'error'         // Stream encountered an error
    ),
    defaultValue: 'scheduled',
    allowNull: false
  },
  
  // Visibility and Access
  visibility: {
    type: DataTypes.ENUM('public', 'unlisted', 'private', 'premium'),
    defaultValue: 'public',
    allowNull: false
  },
  
  is_password_protected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Scheduling
  scheduled_start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  scheduled_end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  actual_start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  actual_end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Stream Configuration
  max_viewers: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 1000,
    validate: {
      min: 1,
      max: 100000
    }
  },
  
  enable_chat: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  enable_recording: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  enable_transcoding: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Recording Configuration
  recording_resource_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  recording_sid: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  recording_status: {
    type: DataTypes.ENUM('none', 'starting', 'recording', 'stopping', 'stopped', 'failed'),
    defaultValue: 'none'
  },
  
  recording_files: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  
  // Stream Quality Settings
  video_quality: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 2000
    }
  },
  
  audio_quality: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      sampleRate: 48000,
      channels: 2,
      bitrate: 128
    }
  },
  
  // Analytics and Metrics
  current_viewers: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  peak_viewers: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  total_viewers: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  total_watch_time: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: 'Total watch time in seconds'
  },
  
  chat_messages_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  likes_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  shares_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  // Bandwidth Usage
  bandwidth_used: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: 'Bandwidth used in bytes'
  },
  
  // Monetization
  is_monetized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  ticket_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    validate: {
      len: [3, 3]
    }
  },
  
  // Geographic Restrictions
  allowed_countries: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Array of ISO country codes, null means all countries allowed'
  },
  
  blocked_countries: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of ISO country codes to block'
  },
  
  // Interaction Settings
  allow_comments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  allow_reactions: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  allow_screen_sharing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  allow_co_hosts: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  max_co_hosts: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  
  // Moderation
  moderation_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  auto_moderation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  banned_words: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  
  // Thumbnail and Preview
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  preview_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  // Categories and Tags
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  
  // Technical Details
  stream_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  
  rtmp_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  hls_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  webrtc_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  // Error Handling
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  error_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  
  // Additional Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  
  // Audit Fields
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'live_streams',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['visibility']
    },
    {
      fields: ['channel_name'],
      unique: true
    },
    {
      fields: ['slug'],
      unique: true
    },
    {
      fields: ['scheduled_start_time']
    },
    {
      fields: ['actual_start_time']
    },
    {
      fields: ['category']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['peak_viewers']
    },
    {
      fields: ['total_viewers']
    }
  ],
  
  validate: {
    scheduledTimesValid() {
      if (this.scheduled_start_time && this.scheduled_end_time) {
        if (this.scheduled_start_time >= this.scheduled_end_time) {
          throw new Error('Scheduled end time must be after start time');
        }
      }
    },
    
    actualTimesValid() {
      if (this.actual_start_time && this.actual_end_time) {
        if (this.actual_start_time >= this.actual_end_time) {
          throw new Error('Actual end time must be after start time');
        }
      }
    },
    
    monetizationValid() {
      if (this.is_monetized && (!this.ticket_price || this.ticket_price <= 0)) {
        throw new Error('Monetized streams must have a valid ticket price');
      }
    }
  }
});

// Associations
LiveStream.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

User.hasMany(LiveStream, {
  foreignKey: 'user_id',
  as: 'liveStreams'
});

// Hooks
LiveStream.beforeCreate(async (stream) => {
  // Generate slug if not provided
  if (!stream.slug) {
    stream.slug = stream.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Ensure uniqueness
    let counter = 1;
    let originalSlug = stream.slug;
    while (await LiveStream.findOne({ where: { slug: stream.slug } })) {
      stream.slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }
  
  // Generate stream key if not provided
  if (!stream.stream_key) {
    stream.stream_key = crypto.randomBytes(32).toString('hex');
  }
  
  // Set default broadcaster UID if not provided
  if (!stream.broadcaster_uid) {
    stream.broadcaster_uid = Math.floor(Math.random() * 2147483647) + 1;
  }
  
  logger.audit('live_stream_created', {
    streamId: stream.id,
    userId: stream.user_id,
    title: stream.title,
    channelName: stream.channel_name
  });
});

LiveStream.beforeUpdate(async (stream) => {
  // Update slug if title changed
  if (stream.changed('title') && !stream.changed('slug')) {
    const newSlug = stream.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Check if new slug is different and unique
    if (newSlug !== stream.slug) {
      let counter = 1;
      let originalSlug = newSlug;
      let testSlug = newSlug;
      
      while (await LiveStream.findOne({ 
        where: { 
          slug: testSlug,
          id: { [require('sequelize').Op.ne]: stream.id }
        } 
      })) {
        testSlug = `${originalSlug}-${counter}`;
        counter++;
      }
      
      stream.slug = testSlug;
    }
  }
  
  logger.audit('live_stream_updated', {
    streamId: stream.id,
    userId: stream.user_id,
    changes: stream.changed()
  });
});

LiveStream.beforeDestroy(async (stream) => {
  logger.audit('live_stream_deleted', {
    streamId: stream.id,
    userId: stream.user_id,
    title: stream.title
  });
});

// Instance Methods
LiveStream.prototype.isLive = function() {
  return this.status === 'live';
};

LiveStream.prototype.isScheduled = function() {
  return this.status === 'scheduled';
};

LiveStream.prototype.hasEnded = function() {
  return ['ended', 'cancelled'].includes(this.status);
};

LiveStream.prototype.canStart = function() {
  return ['scheduled', 'preparing'].includes(this.status);
};

LiveStream.prototype.canEnd = function() {
  return ['live', 'paused'].includes(this.status);
};

LiveStream.prototype.isAccessible = function(user = null, password = null) {
  // Check visibility
  if (this.visibility === 'private') {
    return user && user.id === this.user_id;
  }
  
  if (this.visibility === 'premium') {
    return user && (user.is_premium || user.id === this.user_id);
  }
  
  // Check password protection
  if (this.is_password_protected) {
    if (!password) return false;
    const bcrypt = require('bcrypt');
    return bcrypt.compareSync(password, this.password_hash);
  }
  
  return true;
};

LiveStream.prototype.incrementViewers = async function() {
  this.current_viewers += 1;
  this.total_viewers += 1;
  
  if (this.current_viewers > this.peak_viewers) {
    this.peak_viewers = this.current_viewers;
  }
  
  await this.save();
  return this.current_viewers;
};

LiveStream.prototype.decrementViewers = async function() {
  if (this.current_viewers > 0) {
    this.current_viewers -= 1;
    await this.save();
  }
  return this.current_viewers;
};

LiveStream.prototype.addWatchTime = async function(seconds) {
  this.total_watch_time += seconds;
  await this.save();
  return this.total_watch_time;
};

LiveStream.prototype.incrementLikes = async function() {
  this.likes_count += 1;
  await this.save();
  return this.likes_count;
};

LiveStream.prototype.incrementShares = async function() {
  this.shares_count += 1;
  await this.save();
  return this.shares_count;
};

LiveStream.prototype.addChatMessage = async function() {
  this.chat_messages_count += 1;
  await this.save();
  return this.chat_messages_count;
};

LiveStream.prototype.addBandwidthUsage = async function(bytes) {
  this.bandwidth_used += bytes;
  await this.save();
  return this.bandwidth_used;
};

LiveStream.prototype.getStreamUrls = function() {
  return {
    rtmp: this.rtmp_url,
    hls: this.hls_url,
    webrtc: this.webrtc_url
  };
};

LiveStream.prototype.getAnalytics = function() {
  return {
    currentViewers: this.current_viewers,
    peakViewers: this.peak_viewers,
    totalViewers: this.total_viewers,
    totalWatchTime: this.total_watch_time,
    chatMessages: this.chat_messages_count,
    likes: this.likes_count,
    shares: this.shares_count,
    bandwidthUsed: this.bandwidth_used,
    averageWatchTime: this.total_viewers > 0 ? 
      Math.round(this.total_watch_time / this.total_viewers) : 0
  };
};

// Class Methods
LiveStream.findBySlug = function(slug) {
  return this.findOne({
    where: { slug },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }]
  });
};

LiveStream.findByChannelName = function(channelName) {
  return this.findOne({
    where: { channel_name: channelName },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }]
  });
};

LiveStream.findLiveStreams = function(limit = 20, offset = 0) {
  return this.findAndCountAll({
    where: {
      status: 'live',
      visibility: ['public', 'unlisted']
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    order: [['current_viewers', 'DESC'], ['actual_start_time', 'DESC']],
    limit,
    offset
  });
};

LiveStream.findScheduledStreams = function(limit = 20, offset = 0) {
  return this.findAndCountAll({
    where: {
      status: 'scheduled',
      visibility: ['public', 'unlisted'],
      scheduled_start_time: {
        [require('sequelize').Op.gte]: new Date()
      }
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    order: [['scheduled_start_time', 'ASC']],
    limit,
    offset
  });
};

LiveStream.findUserStreams = function(userId, limit = 20, offset = 0) {
  return this.findAndCountAll({
    where: { user_id: userId },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

LiveStream.findPopularStreams = function(timeframe = '24h', limit = 20, offset = 0) {
  const timeMap = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  };
  
  const hours = timeMap[timeframe] || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.findAndCountAll({
    where: {
      visibility: ['public', 'unlisted'],
      created_at: {
        [require('sequelize').Op.gte]: since
      }
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    order: [
      ['peak_viewers', 'DESC'],
      ['total_viewers', 'DESC'],
      ['likes_count', 'DESC']
    ],
    limit,
    offset
  });
};

LiveStream.searchStreams = function(query, limit = 20, offset = 0) {
  const { Op } = require('sequelize');
  
  return this.findAndCountAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { description: { [Op.like]: `%${query}%` } },
            { category: { [Op.like]: `%${query}%` } }
          ]
        },
        {
          visibility: ['public', 'unlisted']
        }
      ]
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
    }],
    order: [
      ['status', 'DESC'], // Live streams first
      ['peak_viewers', 'DESC'],
      ['created_at', 'DESC']
    ],
    limit,
    offset
  });
};

module.exports = LiveStream;