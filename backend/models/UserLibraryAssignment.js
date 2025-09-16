const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserLibraryAssignment = sequelize.define('UserLibraryAssignment', {
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
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_library_assignments',
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
      fields: ['user_id', 'library_id'],
      unique: true
    }
  ]
});

// Define associations
UserLibraryAssignment.associate = (models) => {
  UserLibraryAssignment.belongsTo(models.LibraryMetadata, {
    foreignKey: 'library_id',
    targetKey: 'library_id',
    as: 'library'
  });
};

module.exports = UserLibraryAssignment;