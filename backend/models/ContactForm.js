const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactForm = sequelize.define('ContactForm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  form_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del formulario de contacto'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Título del formulario'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del formulario'
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Configuración de campos del formulario'
  },
  video_upload_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si permite upload de videos'
  },
  video_upload_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración para upload de videos'
  },
  email_notifications: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración de notificaciones por email'
  },
  webhook_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de webhook para notificaciones'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si el formulario está activo'
  },
  require_auth: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si requiere autenticación para enviar'
  },
  allowed_domains: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dominios permitidos para usar el formulario'
  },
  rate_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Límite de envíos por hora por IP'
  },
  auto_response: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración de respuesta automática'
  },
  custom_css: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'CSS personalizado para el formulario'
  },
  success_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensaje de éxito personalizado'
  },
  redirect_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de redirección después del envío'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuario propietario del formulario'
  },
  submission_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Contador de envíos'
  },
  last_submission_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del último envío'
  }
}, {
  tableName: 'contact_forms',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['form_name']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Métodos de instancia
ContactForm.prototype.incrementSubmissionCount = async function() {
  this.submission_count += 1;
  this.last_submission_at = new Date();
  await this.save();
};

ContactForm.prototype.validateDomain = function(domain) {
  if (!this.allowed_domains || this.allowed_domains.length === 0) {
    return true; // Sin restricciones
  }
  return this.allowed_domains.includes(domain) || this.allowed_domains.includes('*');
};

ContactForm.prototype.getEmbedCode = function(baseUrl) {
  return `<iframe src="${baseUrl}/embed/contact-form/${this.id}" width="100%" height="600" frameborder="0"></iframe>`;
};

// Métodos de clase
ContactForm.getActiveFormsByUser = async function(userId) {
  return await this.findAll({
    where: {
      user_id: userId,
      is_active: true
    },
    order: [['createdAt', 'DESC']]
  });
};

ContactForm.findByFormName = async function(formName, userId) {
  return await this.findOne({
    where: {
      form_name: formName,
      user_id: userId,
      is_active: true
    }
  });
};

// Asociaciones
ContactForm.associate = function(models) {
  ContactForm.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  ContactForm.hasMany(models.ContactSubmission, {
    foreignKey: 'contact_form_id',
    as: 'submissions'
  });
};

module.exports = ContactForm;