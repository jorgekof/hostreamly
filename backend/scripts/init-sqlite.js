const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');

// Configuración específica para SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'hostreamly.db'),
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Definir modelo User simplificado para la inicialización
const User = sequelize.define('User', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  email: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true
  },
  username: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  first_name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  last_name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  avatar_url: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  role: {
    type: Sequelize.ENUM('user', 'premium', 'admin', 'super_admin'),
    defaultValue: 'user',
    allowNull: false
  },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  is_verified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  is_premium: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  premium_expires_at: {
    type: Sequelize.DATE,
    allowNull: true
  },
  last_login_at: {
    type: Sequelize.DATE,
    allowNull: true
  },
  last_login_ip: {
    type: Sequelize.STRING(45),
    allowNull: true
  },
  login_attempts: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  locked_until: {
    type: Sequelize.DATE,
    allowNull: true
  },
  two_factor_enabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  two_factor_secret: {
    type: Sequelize.STRING(255),
    allowNull: true
  }
});

// Hook para hashear la contraseña
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Definir modelo Video simplificado
const Video = sequelize.define('Video', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  slug: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true
  },
  thumbnail_url: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  video_url: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  duration: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  file_size: {
    type: Sequelize.BIGINT,
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM('uploading', 'processing', 'ready', 'failed', 'deleted'),
    defaultValue: 'uploading',
    allowNull: false
  },
  visibility: {
    type: Sequelize.ENUM('public', 'unlisted', 'private'),
    defaultValue: 'public',
    allowNull: false
  },
  views_count: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  likes_count: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  dislikes_count: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  comments_count: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  is_premium: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
});

// Definir relaciones
User.hasMany(Video, { foreignKey: 'user_id', as: 'videos' });
Video.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando base de datos SQLite...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión a SQLite exitosa');

    // Sincronizar modelos (crear tablas)
    await sequelize.sync({ force: false });
    console.log('✓ Tablas creadas/sincronizadas');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠ Ya existe un usuario administrador:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      return;
    }

    // Crear usuario administrador
    const adminData = {
      email: 'admin@hostreamly.com',
      username: 'admin',
      password: 'Admin123!@#',
      first_name: 'Administrador',
      last_name: 'Sistema',
      role: 'admin',
      is_active: true,
      is_verified: true,
      is_premium: true
    };

    const adminUser = await User.create(adminData);

    console.log('🎉 Base de datos inicializada exitosamente!');
    console.log('👤 Usuario administrador creado:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: Admin123!@#`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Cambia la contraseña después del primer login');
    console.log('   - Guarda estas credenciales en un lugar seguro');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar si el script se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };