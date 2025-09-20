const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EmbedConfig Model
 * 
 * Almacena configuraciones de embed con protección por dominio
 */
const EmbedConfig = sequelize.define('EmbedConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Relaciones
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  video_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'videos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Token de embed único
  embed_token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    index: true
  },
  
  // Configuración del reproductor
  width: {
    type: DataTypes.INTEGER,
    defaultValue: 640,
    validate: {
      min: 200,
      max: 1920
    }
  },
  
  height: {
    type: DataTypes.INTEGER,
    defaultValue: 360,
    validate: {
      min: 150,
      max: 1080
    }
  },
  
  autoplay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  controls: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  muted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  loop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  responsive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  show_title: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  show_description: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Protección por dominio
  domain_protection_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  domain_protection_type: {
    type: DataTypes.ENUM('whitelist', 'blacklist'),
    defaultValue: 'whitelist',
    comment: 'whitelist: solo dominios permitidos, blacklist: todos excepto bloqueados'
  },
  
  allowed_domains: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de dominios permitidos (whitelist) o bloqueados (blacklist)'
  },
  
  // Configuración adicional
  custom_css: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 10000] // Máximo 10KB de CSS
    }
  },
  
  // Configuración de seguridad
  require_referrer: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Requiere header Referer para validar dominio'
  },
  
  allow_api_access: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Permite acceso directo via API sin referrer'
  },
  
  // Configuración de expiración
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del embed (null = sin expiración)'
  },
  
  // Estadísticas
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  last_viewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Estado
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Metadatos
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'embed_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['video_id']
    },
    {
      fields: ['embed_token'],
      unique: true
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Métodos de instancia
EmbedConfig.prototype.isExpired = function() {
  if (!this.expires_at) return false;
  return new Date() > this.expires_at;
};

EmbedConfig.prototype.isDomainAllowed = function(domain) {
  if (!this.domain_protection_enabled) return true;
  if (!domain) return !this.require_referrer;
  
  // Normalizar dominio
  const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const allowedDomains = (this.allowed_domains || []).map(d => d.toLowerCase());
  
  if (this.domain_protection_type === 'whitelist') {
    // Whitelist: el dominio debe estar en la lista
    return allowedDomains.some(allowedDomain => {
      // Permitir subdominios si el dominio permitido empieza con '.'
      if (allowedDomain.startsWith('.')) {
        return normalizedDomain.endsWith(allowedDomain) || normalizedDomain === allowedDomain.substring(1);
      }
      return normalizedDomain === allowedDomain;
    });
  } else {
    // Blacklist: el dominio NO debe estar en la lista
    return !allowedDomains.some(blockedDomain => {
      if (blockedDomain.startsWith('.')) {
        return normalizedDomain.endsWith(blockedDomain) || normalizedDomain === blockedDomain.substring(1);
      }
      return normalizedDomain === blockedDomain;
    });
  }
};

EmbedConfig.prototype.incrementViewCount = async function() {
  this.view_count += 1;
  this.last_viewed_at = new Date();
  await this.save();
};

// Métodos estáticos
EmbedConfig.findByToken = async function(token) {
  return await this.findOne({
    where: {
      embed_token: token,
      is_active: true
    },
    include: [
      {
        association: 'Video',
        include: ['User']
      }
    ]
  });
};

EmbedConfig.cleanupExpired = async function() {
  const expiredConfigs = await this.findAll({
    where: {
      expires_at: {
        [require('sequelize').Op.lt]: new Date()
      },
      is_active: true
    }
  });
  
  for (const config of expiredConfigs) {
    config.is_active = false;
    await config.save();
  }
  
  return expiredConfigs.length;
};

// Definir asociaciones
EmbedConfig.associate = function(models) {
  // EmbedConfig pertenece a un User
  EmbedConfig.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  
  // EmbedConfig pertenece a un Video
  EmbedConfig.belongsTo(models.Video, {
    foreignKey: 'video_id',
    as: 'Video'
  });
};

module.exports = EmbedConfig;