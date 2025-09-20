const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Video = require('./Video');
const LiveStream = require('./LiveStream');
const LibraryMetadata = require('./LibraryMetadata');
const UserLibraryAssignment = require('./UserLibraryAssignment');
const UserCollection = require('./UserCollection');
const UserVideo = require('./UserVideo');
const EmbedConfig = require('./EmbedConfig');
const DownloadLink = require('./DownloadLink');
const ContactForm = require('./ContactForm');
const ContactSubmission = require('./ContactSubmission');
const ApiKey = require('./ApiKey');

// Create models object
const models = {
  User,
  Video,
  LiveStream,
  LibraryMetadata,
  UserLibraryAssignment,
  UserCollection,
  UserVideo,
  EmbedConfig,
  DownloadLink,
  ContactForm,
  ContactSubmission,
  ApiKey,
  sequelize
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;