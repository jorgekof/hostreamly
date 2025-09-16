const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LibraryMetadata = sequelize.define('LibraryMetadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  library_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  library_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cdn_hostname: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  webhook_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  token_auth_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  max_users: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  current_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  storage_used_gb: {
    type: DataTypes.FLOAT,
    defaultValue: 0.00
  },
  bandwidth_used_gb: {
    type: DataTypes.FLOAT,
    defaultValue: 0.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  health_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'healthy'
  },
  last_health_check: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'library_metadata',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['region']
    },
    {
      fields: ['health_status']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Define associations
LibraryMetadata.associate = (models) => {
  LibraryMetadata.hasMany(models.UserLibraryAssignment, {
    foreignKey: 'library_id',
    sourceKey: 'library_id',
    as: 'assignments'
  });
  
  LibraryMetadata.hasMany(models.UserCollection, {
    foreignKey: 'library_id',
    sourceKey: 'library_id',
    as: 'collections'
  });
  
  LibraryMetadata.hasMany(models.UserVideo, {
    foreignKey: 'library_id',
    sourceKey: 'library_id',
    as: 'videos'
  });
};

module.exports = LibraryMetadata;