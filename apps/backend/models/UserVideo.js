const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserVideo = sequelize.define('UserVideo', {
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
  video_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  bunny_video_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  file_size_bytes: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  video_url: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'processing'
  },
  upload_progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  encoding_progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'user_videos',
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
      fields: ['collection_id']
    },
    {
      fields: ['bunny_video_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
UserVideo.associate = (models) => {
  UserVideo.belongsTo(models.LibraryMetadata, {
    foreignKey: 'library_id',
    targetKey: 'library_id',
    as: 'library'
  });
  
  UserVideo.belongsTo(models.UserCollection, {
    foreignKey: 'collection_id',
    targetKey: 'collection_id',
    as: 'collection'
  });
};

module.exports = UserVideo;