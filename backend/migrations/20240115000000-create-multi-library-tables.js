'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create library_metadata table
    await queryInterface.createTable('library_metadata', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      library_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Bunny Stream Library ID'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Library display name'
      },
      region: {
        type: Sequelize.ENUM('europe', 'us-east', 'us-west', 'asia', 'oceania'),
        allowNull: false,
        defaultValue: 'europe',
        comment: 'Library region'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Library status'
      },
      max_users: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum users that can be assigned to this library'
      },
      storage_used: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Storage used in bytes'
      },
      bandwidth_used: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Bandwidth used in bytes'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create user_library_assignments table
    await queryInterface.createTable('user_library_assignments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      library_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'library_metadata',
          key: 'library_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      assigned_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create user_collections table
    await queryInterface.createTable('user_collections', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      collection_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Bunny Stream Collection ID'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      library_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'library_metadata',
          key: 'library_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Collection display name'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create user_videos table (enhanced video metadata)
    await queryInterface.createTable('user_videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      video_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Bunny Stream Video ID'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      library_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'library_metadata',
          key: 'library_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      collection_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'user_collections',
          key: 'collection_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('uploading', 'processing', 'ready', 'failed'),
        allowNull: false,
        defaultValue: 'uploading'
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'File size in bytes'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Video duration in seconds'
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('user_library_assignments', ['user_id']);
    await queryInterface.addIndex('user_library_assignments', ['library_id']);
    await queryInterface.addIndex('user_library_assignments', ['user_id', 'status']);
    
    await queryInterface.addIndex('user_collections', ['user_id']);
    await queryInterface.addIndex('user_collections', ['library_id']);
    await queryInterface.addIndex('user_collections', ['user_id', 'library_id']);
    
    await queryInterface.addIndex('user_videos', ['user_id']);
    await queryInterface.addIndex('user_videos', ['library_id']);
    await queryInterface.addIndex('user_videos', ['collection_id']);
    await queryInterface.addIndex('user_videos', ['status']);
    await queryInterface.addIndex('user_videos', ['user_id', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('user_videos');
    await queryInterface.dropTable('user_collections');
    await queryInterface.dropTable('user_library_assignments');
    await queryInterface.dropTable('library_metadata');
  }
};