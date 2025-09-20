const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function createAdminUser() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión a la base de datos exitosa');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync();
    console.log('✓ Modelos sincronizados');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await User.findOne({
      where: {
        role: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('⚠ Ya existe un usuario administrador:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Nombre: ${existingAdmin.first_name} ${existingAdmin.last_name}`);
      return;
    }

    // Datos del usuario administrador
    const adminData = {
      email: 'admin@hostreamly.com',
      username: 'admin',
      password: 'Admin123!@#', // Contraseña temporal - cambiar después del primer login
      first_name: 'Administrador',
      last_name: 'Sistema',
      role: 'admin',
      is_active: true,
      is_verified: true,
      is_premium: true
    };

    // Crear el usuario administrador
    const adminUser = await User.create(adminData);

    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('📧 Credenciales de acceso:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: Admin123!@#`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Cambia la contraseña después del primer login');
    console.log('   - Guarda estas credenciales en un lugar seguro');
    console.log('   - El usuario tiene rol de administrador completo');

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:');
    console.error(error.message);
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Errores de validación:');
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('El email o username ya existe en la base de datos');
    }
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log('Conexión a la base de datos cerrada');
  }
}

// Ejecutar si el script se llama directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };