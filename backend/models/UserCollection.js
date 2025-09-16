const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserCollection = sequelize.define('UserCollection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  library_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  collection_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  collection_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  video_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_size_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  }
}, {
  tableName: 'user_collections',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['library_id']
    },
    {
      fields: ['user_id', 'library_id', 'collection_id'],
      unique: true
    }
  ]
});

// Define associations
UserCollection.associate = (models) => {
  UserCollection.belongsTo(models.LibraryMetadata, {
    foreignKey: 'library_id',
    targetKey: 'library_id',
    as: 'library'
  });
  
  UserCollection.hasMany(models.UserVideo, {
    foreignKey: 'collection_id',
    sourceKey: 'collection_id',
    as: 'videos'
  });
};

module.exports = UserCollection;