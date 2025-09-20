const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactSubmission = sequelize.define('ContactSubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contact_form_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ContactForms',
      key: 'id'
    },
    comment: 'ID del formulario de contacto'
  },
  submission_data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Datos del formulario enviado'
  },
  video_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Videos',
      key: 'id'
    },
    comment: 'Video adjunto (si aplica)'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuario que envió (si está autenticado)'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Dirección IP del remitente'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent del navegador'
  },
  referrer: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de referencia'
  },
  status: {
    type: DataTypes.ENUM('pending', 'read', 'replied', 'archived', 'spam'),
    defaultValue: 'pending',
    comment: 'Estado del envío'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    comment: 'Prioridad del envío'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Etiquetas para organización'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas internas'
  },
  email_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si se envió notificación por email'
  },
  webhook_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si se envió webhook'
  },
  auto_response_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si se envió respuesta automática'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de lectura'
  },
  replied_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de respuesta'
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de archivo'
  }
}, {
  tableName: 'contact_submissions',
  timestamps: true,
  indexes: [
    {
      fields: ['contact_form_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['ip_address']
    }
  ]
});

// Métodos de instancia
ContactSubmission.prototype.markAsRead = async function() {
  if (this.status === 'pending') {
    this.status = 'read';
    this.read_at = new Date();
    await this.save();
  }
};

ContactSubmission.prototype.markAsReplied = async function() {
  this.status = 'replied';
  this.replied_at = new Date();
  await this.save();
};

ContactSubmission.prototype.archive = async function() {
  this.status = 'archived';
  this.archived_at = new Date();
  await this.save();
};

ContactSubmission.prototype.addTag = async function(tag) {
  if (!this.tags) {
    this.tags = [];
  }
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
};

ContactSubmission.prototype.removeTag = async function(tag) {
  if (this.tags && this.tags.includes(tag)) {
    this.tags = this.tags.filter(t => t !== tag);
    await this.save();
  }
};

ContactSubmission.prototype.getFormattedData = function() {
  const formatted = {};
  
  if (this.submission_data) {
    Object.keys(this.submission_data).forEach(key => {
      // Formatear campos especiales
      if (key.toLowerCase().includes('email')) {
        formatted[key] = this.submission_data[key];
      } else if (key.toLowerCase().includes('phone')) {
        formatted[key] = this.submission_data[key];
      } else {
        formatted[key] = this.submission_data[key];
      }
    });
  }
  
  return formatted;
};

// Métodos de clase
ContactSubmission.getByFormId = async function(formId, options = {}) {
  const { status, priority, limit = 50, offset = 0 } = options;
  
  const where = { contact_form_id: formId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  
  return await this.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: require('./Video'),
        as: 'video',
        attributes: ['id', 'title', 'filename', 'thumbnail_url']
      },
      {
        model: require('./User'),
        as: 'user',
        attributes: ['id', 'username', 'email']
      }
    ]
  });
};

ContactSubmission.getStatsByFormId = async function(formId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const submissions = await this.findAll({
    where: {
      contact_form_id: formId,
      createdAt: {
        [require('sequelize').Op.gte]: startDate
      }
    },
    attributes: ['status', 'priority', 'createdAt']
  });
  
  const stats = {
    total: submissions.length,
    by_status: {},
    by_priority: {},
    by_day: {}
  };
  
  submissions.forEach(submission => {
    // Por estado
    stats.by_status[submission.status] = (stats.by_status[submission.status] || 0) + 1;
    
    // Por prioridad
    stats.by_priority[submission.priority] = (stats.by_priority[submission.priority] || 0) + 1;
    
    // Por día
    const day = submission.createdAt.toISOString().split('T')[0];
    stats.by_day[day] = (stats.by_day[day] || 0) + 1;
  });
  
  return stats;
};

ContactSubmission.cleanupOldSubmissions = async function(days = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return await this.destroy({
    where: {
      createdAt: {
        [require('sequelize').Op.lt]: cutoffDate
      },
      status: 'archived'
    }
  });
};

// Asociaciones
ContactSubmission.associate = function(models) {
  ContactSubmission.belongsTo(models.ContactForm, {
    foreignKey: 'contact_form_id',
    as: 'contactForm'
  });
  
  ContactSubmission.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  ContactSubmission.belongsTo(models.Video, {
    foreignKey: 'video_id',
    as: 'video'
  });
};

module.exports = ContactSubmission;