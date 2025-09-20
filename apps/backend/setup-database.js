#!/usr/bin/env node

/**
 * Script para configurar la base de datos en producción
 * Crea las tablas necesarias y configura los datos iniciales
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Configuración de base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostreamly',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// SQL para crear las tablas
const createTablesSQL = `
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(500),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Tabla de streams
CREATE TABLE IF NOT EXISTS streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  agora_channel VARCHAR(100),
  agora_token TEXT,
  status ENUM('offline', 'live', 'ended') DEFAULT 'offline',
  viewer_count INT DEFAULT 0,
  max_viewers INT DEFAULT 0,
  category VARCHAR(50),
  tags JSON,
  is_private BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_category (category)
);

-- Tabla de seguidores
CREATE TABLE IF NOT EXISTS followers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
);

-- Tabla de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stream_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'emote', 'system') DEFAULT 'text',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_stream_id (stream_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Tabla de archivos subidos
CREATE TABLE IF NOT EXISTS uploaded_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  cdn_url VARCHAR(500),
  upload_type ENUM('avatar', 'thumbnail', 'video', 'document', 'other') DEFAULT 'other',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_upload_type (upload_type)
);

-- Tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);

-- Tabla de sesiones (para Redis backup)
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id INT,
  session_data TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
`;

// Datos iniciales del sistema
const initialData = [
  {
    table: 'system_settings',
    data: [
      { setting_key: 'site_name', setting_value: 'Hostreamly', description: 'Nombre del sitio', is_public: true },
      { setting_key: 'site_description', setting_value: 'Plataforma de streaming en vivo', description: 'Descripción del sitio', is_public: true },
      { setting_key: 'max_upload_size', setting_value: '100MB', description: 'Tamaño máximo de archivo', is_public: false },
      { setting_key: 'allowed_file_types', setting_value: 'jpg,jpeg,png,gif,mp4,mov,avi', description: 'Tipos de archivo permitidos', is_public: false },
      { setting_key: 'agora_app_id', setting_value: process.env.AGORA_APP_ID || '', description: 'Agora App ID', is_public: false },
      { setting_key: 'maintenance_mode', setting_value: 'false', description: 'Modo mantenimiento', is_public: false }
    ]
  }
];

async function connectToDatabase() {
  try {
    log('Conectando a la base de datos...', 'blue');
    const connection = await mysql.createConnection(dbConfig);
    logSuccess('Conexión establecida exitosamente');
    return connection;
  } catch (error) {
    logError('Error conectando a la base de datos:');
    logError(error.message);
    throw error;
  }
}

async function createTables(connection) {
  logStep('1', 'Creando tablas de la base de datos...');
  
  try {
    // Dividir el SQL en statements individuales
    const statements = createTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    logSuccess('Todas las tablas creadas exitosamente');
  } catch (error) {
    logError('Error creando tablas:');
    logError(error.message);
    throw error;
  }
}

async function insertInitialData(connection) {
  logStep('2', 'Insertando datos iniciales...');
  
  try {
    for (const { table, data } of initialData) {
      for (const row of data) {
        const columns = Object.keys(row).join(', ');
        const placeholders = Object.keys(row).map(() => '?').join(', ');
        const values = Object.values(row);
        
        const sql = `INSERT IGNORE INTO ${table} (${columns}) VALUES (${placeholders})`;
        await connection.execute(sql, values);
      }
      
      logSuccess(`Datos iniciales insertados en ${table}`);
    }
  } catch (error) {
    logError('Error insertando datos iniciales:');
    logError(error.message);
    throw error;
  }
}

async function verifySetup(connection) {
  logStep('3', 'Verificando configuración...');
  
  try {
    // Verificar tablas creadas
    const [tables] = await connection.execute('SHOW TABLES');
    log(`Tablas creadas: ${tables.length}`, 'blue');
    
    // Verificar datos iniciales
    const [settings] = await connection.execute('SELECT COUNT(*) as count FROM system_settings');
    log(`Configuraciones del sistema: ${settings[0].count}`, 'blue');
    
    logSuccess('Verificación completada exitosamente');
  } catch (error) {
    logError('Error en verificación:');
    logError(error.message);
    throw error;
  }
}

async function main() {
  log('🗄️  CONFIGURANDO BASE DE DATOS DE PRODUCCIÓN', 'bright');
  log('============================================\n', 'bright');
  
  let connection;
  
  try {
    // Mostrar configuración (sin password)
    log('Configuración de base de datos:', 'yellow');
    log(`Host: ${dbConfig.host}:${dbConfig.port}`, 'blue');
    log(`Database: ${dbConfig.database}`, 'blue');
    log(`User: ${dbConfig.user}`, 'blue');
    log(`SSL: ${dbConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`, 'blue');
    
    connection = await connectToDatabase();
    await createTables(connection);
    await insertInitialData(connection);
    await verifySetup(connection);
    
    log('\n' + '='.repeat(50), 'cyan');
    log('✅ BASE DE DATOS CONFIGURADA EXITOSAMENTE', 'green');
    log('='.repeat(50), 'cyan');
    
    log('\nPróximos pasos:', 'yellow');
    log('1. Verifica que todas las tablas estén creadas');
    log('2. Configura las variables de entorno en DigitalOcean');
    log('3. Ejecuta el deployment de la aplicación');
    
  } catch (error) {
    logError('Configuración de base de datos falló');
    logError(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('Conexión cerrada', 'blue');
    }
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, createTables, insertInitialData };