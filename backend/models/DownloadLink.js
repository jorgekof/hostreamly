const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DownloadLink = sequelize.define('DownloadLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    comment: 'Unique token for secure download access'
  },
  video_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Videos',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Reference to the video being downloaded'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'User who created the download link'
  },
  requester_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: 'Email of the person requesting the download (if different from user)'
  },
  requester_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Name of the person requesting the download'
  },
  download_type: {
    type: DataTypes.ENUM('original', 'transcoded', 'thumbnail', 'preview'),
    allowNull: false,
    defaultValue: 'transcoded',
    comment: 'Type of file to download'
  },
  quality: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Video quality for transcoded downloads (e.g., 720p, 1080p)'
  },
  format: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'File format for download (mp4, webm, etc.)'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When the download link expires'
  },
  max_downloads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 100
    },
    comment: 'Maximum number of downloads allowed'
  },
  download_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Current number of downloads'
  },
  ip_restrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of allowed IP addresses or CIDR blocks'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Optional password protection for the download'
  },
  require_auth: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether authentication is required to download'
  },
  notify_on_download: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether to notify the creator when file is downloaded'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata (file size, duration, etc.)'
  },
  last_accessed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the link was last accessed'
  },
  last_accessed_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of last access'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent of last access'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'disabled', 'exhausted'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Current status of the download link'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes about the download link'
  }
}, {
  tableName: 'download_links',
  timestamps: true,
  paranoid: true, // Soft deletes
  indexes: [
    {
      fields: ['token'],
      unique: true
    },
    {
      fields: ['video_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['status']
    },
    {
      fields: ['requester_email']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (downloadLink) => {
      // Generate secure token if not provided
      if (!downloadLink.token) {
        const crypto = require('crypto');
        downloadLink.token = crypto.randomBytes(64).toString('hex');
      }
      
      // Set default expiration if not provided (24 hours)
      if (!downloadLink.expires_at) {
        downloadLink.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    },
    
    beforeUpdate: (downloadLink) => {
      // Update status based on conditions
      const now = new Date();
      
      if (downloadLink.expires_at && downloadLink.expires_at < now) {
        downloadLink.status = 'expired';
      } else if (downloadLink.download_count >= downloadLink.max_downloads) {
        downloadLink.status = 'exhausted';
      }
    }
  }
});

// Instance methods
DownloadLink.prototype.isValid = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.expires_at > now &&
    this.download_count < this.max_downloads
  );
};

DownloadLink.prototype.canDownload = function(ip = null) {
  if (!this.isValid()) {
    return { allowed: false, reason: 'Link is not valid' };
  }
  
  // Check IP restrictions
  if (this.ip_restrictions && this.ip_restrictions.length > 0 && ip) {
    const isAllowed = this.ip_restrictions.some(restriction => {
      if (restriction.includes('/')) {
        // CIDR block check
        const { isIPInCIDR } = require('../utils/ipUtils');
        return isIPInCIDR(ip, restriction);
      } else {
        // Direct IP match
        return ip === restriction;
      }
    });
    
    if (!isAllowed) {
      return { allowed: false, reason: 'IP address not allowed' };
    }
  }
  
  return { allowed: true };
};

DownloadLink.prototype.incrementDownload = async function(ip = null, userAgent = null) {
  this.download_count += 1;
  this.last_accessed_at = new Date();
  
  if (ip) this.last_accessed_ip = ip;
  if (userAgent) this.user_agent = userAgent;
  
  // Update status if exhausted
  if (this.download_count >= this.max_downloads) {
    this.status = 'exhausted';
  }
  
  await this.save();
};

// Class methods
DownloadLink.cleanupExpired = async function() {
  const now = new Date();
  
  const [updatedCount] = await DownloadLink.update(
    { status: 'expired' },
    {
      where: {
        expires_at: { [require('sequelize').Op.lt]: now },
        status: 'active'
      }
    }
  );
  
  return updatedCount;
};

// Define associations
DownloadLink.associate = function(models) {
  // DownloadLink belongs to User
  DownloadLink.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // DownloadLink belongs to Video
  DownloadLink.belongsTo(models.Video, {
    foreignKey: 'video_id',
    as: 'video'
  });
};

module.exports = DownloadLink;