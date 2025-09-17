#!/usr/bin/env node

/**
 * Script para crear usuario administrador en producción
 * Funciona con PostgreSQL/MariaDB en DigitalOcean App Platform
 */

const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Configuración de base de datos para producción
const sequelize = new Sequelize(process.env.DATABASE_URL || {
  database: process.env.DB_NAME || 'hostreamly_db',
  username: process.env.DB_USER || 'hostreamly_user', 
  password: process.env.DB_PASSWORD || 'hostreamly_password_secure_2024',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Definir modelo User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'super_admin'),
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

async function createAdminUser() {
  try {
    console.log('🔗 Conectando a la base de datos de producción...');
    
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync();
    console.log('✅ Modelos sincronizados.');

    // Verificar si ya existe un administrador
    const existingAdmin = await User.findOne({
      where: {
        role: ['admin', 'super_admin']
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Crear usuario administrador
    const adminPassword = 'Admin123!@#';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await User.create({
      id: uuidv4(),
      email: 'admin@hostreamly.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      is_premium: true,
      first_name: 'Administrator',
      last_name: 'Hostreamly'
    });

    console.log('🎉 ¡Usuario administrador creado exitosamente!');
    console.log('');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('   Email: admin@hostreamly.com');
    console.log('   Username: admin');
    console.log('   Password: Admin123!@#');
    console.log('   Role: admin');
    console.log('');
    console.log('🔐 IMPORTANTE - SEGURIDAD:');
    console.log('   1. Cambia la contraseña después del primer login');
    console.log('   2. Configura autenticación de dos factores si está disponible');
    console.log('   3. No compartas estas credenciales');
    console.log('');
    console.log('🌐 ACCESO:');
    console.log('   URL: https://hostreamly-static-xcas9.ondigitalocean.app');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
    console.error('');
    console.error('🔍 DETALLES DEL ERROR:');
    console.error('   - Verifica que la base de datos esté configurada correctamente');
    console.error('   - Asegúrate de que las variables de entorno estén definidas');
    console.error('   - Comprueba la conectividad de red');
    console.error('');
    console.error('📋 VARIABLES DE ENTORNO REQUERIDAS:');
    console.error('   - DATABASE_URL o DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
    console.error('   - DB_DIALECT (postgres, mariadb, mysql)');
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };