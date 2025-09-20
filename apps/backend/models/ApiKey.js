const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Unnamed API Key',
    validate: {
      len: {
        args: [1, 100],
        msg: 'Name must be between 1 and 100 characters'
      }
    }
  },
  keyHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Hashed API key for security'
  },
  keyPrefix: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Truncated key for display purposes'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['embed:read', 'video:read'],
    validate: {
      isValidPermissions(value) {
        const validPermissions = [
          'embed:read', 'embed:write',
          'video:read', 'video:write',
          'analytics:read',
          'thumbnail:read', 'thumbnail:write'
        ];
        
        if (!Array.isArray(value)) {
          throw new Error('Permissions must be an array');
        }
        
        for (const permission of value) {
          if (!validPermissions.includes(permission)) {
            throw new Error(`Invalid permission: ${permission}`);
          }
        }
      }
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'API key expiration date, null means never expires'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this API key was used'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times this API key has been used'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this API key is active'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'api_keys',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['keyHash'],
      unique: true
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['expiresAt']
    }
  ],
  hooks: {
    beforeUpdate: (apiKey) => {
      apiKey.updatedAt = new Date();
    }
  }
});

// Instance methods
ApiKey.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

ApiKey.prototype.incrementUsage = async function() {
  try {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    await this.save();
    return true;
  } catch (error) {
    logger.error('Error incrementing API key usage:', error);
    return false;
  }
};

ApiKey.prototype.toSafeObject = function() {
  return {
    id: this.id,
    name: this.name,
    keyPrefix: this.keyPrefix,
    permissions: this.permissions,
    expiresAt: this.expiresAt,
    lastUsedAt: this.lastUsedAt,
    usageCount: this.usageCount,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Class methods
ApiKey.findByUserId = async function(userId) {
  try {
    return await this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    logger.error('Error finding API keys by user ID:', error);
    throw error;
  }
};

ApiKey.findActiveKeys = async function() {
  try {
    return await this.findAll({
      where: {
        isActive: true,
        [sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [sequelize.Op.gt]: new Date() } }
        ]
      }
    });
  } catch (error) {
    logger.error('Error finding active API keys:', error);
    throw error;
  }
};

ApiKey.findByIdAndUserId = async function(id, userId) {
  try {
    return await this.findOne({
      where: { id, userId }
    });
  } catch (error) {
    logger.error('Error finding API key by ID and user ID:', error);
    throw error;
  }
};

// Define associations
ApiKey.associate = function(models) {
  ApiKey.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = ApiKey;