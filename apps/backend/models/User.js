const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      },
      len: {
        args: [5, 255],
        msg: 'Email must be between 5 and 255 characters'
      }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      },
      isAlphanumeric: {
        msg: 'Username can only contain letters and numbers'
      }
    },
    set(value) {
      this.setDataValue('username', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [8, 255],
        msg: 'Password must be at least 8 characters long'
      }
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: 'First name must be between 1 and 100 characters'
      }
    },
    set(value) {
      this.setDataValue('first_name', value.trim());
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: 'Last name must be between 1 and 100 characters'
      }
    },
    set(value) {
      this.setDataValue('last_name', value.trim());
    }
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Avatar URL must be a valid URL'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'premium', 'admin', 'super_admin'),
    defaultValue: 'user',
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  premium_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email_verification_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  two_factor_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  backup_codes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        marketing: false
      },
      privacy: {
        profile_visibility: 'public',
        show_activity: true
      }
    },
    allowNull: false
  },
  storage_used: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false
  },
  storage_limit: {
    type: DataTypes.BIGINT,
    defaultValue: 5368709120, // 5GB default
    allowNull: false
  },
  bandwidth_used_month: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false
  },
  bandwidth_limit_month: {
    type: DataTypes.BIGINT,
    defaultValue: 107374182400, // 100GB default
    allowNull: false
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  api_key_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_premium']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['last_login_at']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    afterCreate: (user) => {
      logger.audit('user_created', user.id, 'user', {
        email: user.email,
        username: user.username,
        role: user.role
      });
    },
    afterUpdate: (user) => {
      if (user.changed()) {
        logger.audit('user_updated', user.id, 'user', {
          changes: user.changed()
        });
      }
    },
    afterDestroy: (user) => {
      logger.audit('user_deleted', user.id, 'user', {
        email: user.email,
        username: user.username
      });
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error('Password comparison error:', error);
    return false;
  }
};

User.prototype.isLocked = function() {
  return !!(this.locked_until && this.locked_until > Date.now());
};

User.prototype.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.locked_until && this.locked_until < Date.now()) {
    return this.update({
      login_attempts: 1,
      locked_until: null
    });
  }
  
  const updates = { login_attempts: this.login_attempts + 1 };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.login_attempts + 1 >= 5 && !this.isLocked()) {
    updates.locked_until = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  return this.update(updates);
};

User.prototype.resetLoginAttempts = async function() {
  return this.update({
    login_attempts: 0,
    locked_until: null
  });
};

User.prototype.updateLastLogin = async function(ip) {
  return this.update({
    last_login_at: new Date(),
    last_login_ip: ip
  });
};

User.prototype.isPremiumActive = function() {
  if (!this.is_premium) return false;
  if (!this.premium_expires_at) return true; // Lifetime premium
  return new Date() < this.premium_expires_at;
};

User.prototype.getRemainingStorage = function() {
  return Math.max(0, this.storage_limit - this.storage_used);
};

User.prototype.getRemainingBandwidth = function() {
  return Math.max(0, this.bandwidth_limit_month - this.bandwidth_used_month);
};

User.prototype.canUpload = function(fileSize) {
  return this.getRemainingStorage() >= fileSize;
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Remove sensitive fields
  delete values.password;
  delete values.email_verification_token;
  delete values.password_reset_token;
  delete values.two_factor_secret;
  delete values.backup_codes;
  delete values.api_key;
  
  return values;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({
    where: { email: email.toLowerCase().trim() }
  });
};

User.findByUsername = function(username) {
  return this.findOne({
    where: { username: username.toLowerCase().trim() }
  });
};

User.findByEmailOrUsername = function(identifier) {
  const { Op } = require('sequelize');
  const cleanIdentifier = identifier.toLowerCase().trim();
  
  return this.findOne({
    where: {
      [Op.or]: [
        { email: cleanIdentifier },
        { username: cleanIdentifier }
      ]
    }
  });
};

User.getActiveUsers = function(limit = 10, offset = 0) {
  return this.findAndCountAll({
    where: { is_active: true },
    attributes: { exclude: ['password'] },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

User.getPremiumUsers = function() {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      is_premium: true,
      [Op.or]: [
        { premium_expires_at: null },
        { premium_expires_at: { [Op.gt]: new Date() } }
      ]
    },
    attributes: { exclude: ['password'] }
  });
};

// Define associations
User.associate = function(models) {
  User.hasMany(models.Video, {
    foreignKey: 'user_id',
    as: 'videos'
  });
  
  User.hasMany(models.ApiKey, {
    foreignKey: 'userId',
    as: 'apiKeys'
  });
};

module.exports = User;