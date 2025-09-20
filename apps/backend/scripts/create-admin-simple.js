const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

async function createAdminUser() {
  const dbPath = path.join(__dirname, '..', 'hostreamly.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('✓ Conectando a SQLite database...');

    // Crear tabla users si no existe
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          is_active BOOLEAN DEFAULT 1,
          is_verified BOOLEAN DEFAULT 0,
          is_premium BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✓ Tabla users creada/verificada');

    // Verificar si ya existe un admin
    const existingAdmin = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE role = ?', ['admin'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingAdmin) {
      console.log('⚠ Ya existe un usuario administrador:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Nombre: ${existingAdmin.first_name} ${existingAdmin.last_name}`);
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

    // Datos del admin
    const now = new Date().toISOString();
    const adminData = {
      id: uuidv4(),
      email: 'admin@hostreamly.com',
      username: 'admin',
      password: hashedPassword,
      first_name: 'Administrador',
      last_name: 'Sistema',
      role: 'admin',
      is_active: 1,
      is_verified: 1,
      is_premium: 1,
      created_at: now,
      updated_at: now
    };

    // Insertar usuario admin
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (
          id, email, username, password, first_name, last_name, 
          role, is_active, is_verified, is_premium, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminData.id,
        adminData.email,
        adminData.username,
        adminData.password,
        adminData.first_name,
        adminData.last_name,
        adminData.role,
        adminData.is_active,
        adminData.is_verified,
        adminData.is_premium,
        adminData.created_at,
        adminData.updated_at
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('📧 Credenciales de acceso:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: Admin123!@#`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Cambia la contraseña después del primer login');
    console.log('   - Guarda estas credenciales en un lugar seguro');
    console.log('   - El usuario tiene rol de administrador completo');
    console.log(`   - Base de datos: ${dbPath}`);

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:');
    console.error(error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error cerrando la base de datos:', err.message);
      } else {
        console.log('✓ Conexión a la base de datos cerrada');
      }
    });
  }
}

// Ejecutar si el script se llama directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };