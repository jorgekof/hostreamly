#!/usr/bin/env node

/**
 * Script de Configuración de MariaDB para Producción
 * 
 * Este script ayuda a configurar MariaDB correctamente para producción,
 * incluyendo la creación de la base de datos, usuario y permisos necesarios.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateMariaDBSetupSQL() {
  const sqlContent = `-- Configuración de MariaDB para Hostreamly
-- Ejecutar como usuario root de MariaDB

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hostreamly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario para la aplicación
CREATE USER IF NOT EXISTS 'hostreamly_user'@'localhost' IDENTIFIED BY 'hostreamly_password_secure_2024';
CREATE USER IF NOT EXISTS 'hostreamly_user'@'%' IDENTIFIED BY 'hostreamly_password_secure_2024';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON hostreamly.* TO 'hostreamly_user'@'localhost';
GRANT ALL PRIVILEGES ON hostreamly.* TO 'hostreamly_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Configurar autenticación compatible
ALTER USER 'hostreamly_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'hostreamly_password_secure_2024';
ALTER USER 'hostreamly_user'@'%' IDENTIFIED WITH mysql_native_password BY 'hostreamly_password_secure_2024';

-- Verificar usuarios creados
SELECT User, Host, plugin FROM mysql.user WHERE User = 'hostreamly_user';

-- Mostrar bases de datos
SHOW DATABASES;
`;

  const sqlPath = path.join(process.cwd(), 'setup-mariadb.sql');
  fs.writeFileSync(sqlPath, sqlContent);
  
  log(`✅ Archivo SQL generado: ${sqlPath}`, 'green');
  return sqlPath;
}

function generateProductionEnv() {
  const envContent = `# Configuración de Producción para MariaDB
# Copiar estas variables al archivo .env del backend

# Database (MariaDB para producción)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostreamly
DB_USER=hostreamly_user
DB_PASSWORD=hostreamly_password_secure_2024
DB_DIALECT=mariadb
DB_SSL=false
DB_LOGGING=false
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Configuraciones adicionales para producción
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_here_change_this
SESSION_SECRET=your_super_secure_session_secret_here_change_this

# Redis para sesiones (recomendado para producción)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Bunny.net configuración
BUNNY_API_KEY=your_bunny_api_key_here
BUNNY_STREAM_LIBRARY_ID=your_library_id_here
BUNNY_STORAGE_ZONE=your_storage_zone_here
BUNNY_CDN_HOSTNAME=your_cdn_hostname_here
`;

  const envPath = path.join(process.cwd(), 'backend', '.env.production');
  fs.writeFileSync(envPath, envContent);
  
  log(`✅ Archivo de configuración de producción generado: ${envPath}`, 'green');
  return envPath;
}

function generateMigrationInstructions() {
  const instructions = `
# 📋 INSTRUCCIONES DE MIGRACIÓN A MARIADB

## 1. Instalar MariaDB

### Windows:
- Descargar desde: https://mariadb.org/download/
- Instalar con configuración por defecto
- Recordar la contraseña de root

### Linux (Ubuntu/Debian):
\`\`\`bash
sudo apt update
sudo apt install mariadb-server
sudo mysql_secure_installation
\`\`\`

### macOS:
\`\`\`bash
brew install mariadb
brew services start mariadb
\`\`\`

## 2. Configurar Base de Datos

1. Conectar a MariaDB como root:
   \`\`\`bash
   mysql -u root -p
   \`\`\`

2. Ejecutar el archivo SQL generado:
   \`\`\`sql
   source setup-mariadb.sql;
   \`\`\`

   O ejecutar directamente:
   \`\`\`bash
   mysql -u root -p < setup-mariadb.sql
   \`\`\`

## 3. Configurar Variables de Entorno

1. Copiar configuración de producción:
   \`\`\`bash
   cp backend/.env.production backend/.env
   \`\`\`

2. Editar \`backend/.env\` y actualizar:
   - \`JWT_SECRET\`: Generar un secreto seguro
   - \`SESSION_SECRET\`: Generar un secreto seguro
   - \`BUNNY_API_KEY\`: Tu clave API de Bunny.net
   - \`BUNNY_STREAM_LIBRARY_ID\`: Tu ID de biblioteca de Bunny Stream

## 4. Ejecutar Migraciones

\`\`\`bash
cd backend
npm run migrate
\`\`\`

## 5. Verificar Migración

\`\`\`bash
node scripts/verify-mariadb-migration.cjs
\`\`\`

## 6. Iniciar Aplicación

\`\`\`bash
# Backend
cd backend
npm run start

# Frontend (en otra terminal)
npm run build
npm run preview
\`\`\`

## 🔧 Solución de Problemas

### Error de Autenticación
Si obtienes errores de autenticación, ejecuta en MariaDB:
\`\`\`sql
ALTER USER 'hostreamly_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'hostreamly_password_secure_2024';
FLUSH PRIVILEGES;
\`\`\`

### Error de Conexión
1. Verificar que MariaDB esté ejecutándose:
   \`\`\`bash
   sudo systemctl status mariadb  # Linux
   brew services list | grep mariadb  # macOS
   \`\`\`

2. Verificar puerto (por defecto 3306):
   \`\`\`bash
   netstat -tlnp | grep 3306
   \`\`\`

### Permisos de Usuario
Verificar permisos del usuario:
\`\`\`sql
SHOW GRANTS FOR 'hostreamly_user'@'localhost';
\`\`\`

## 📊 Monitoreo

Para monitorear el rendimiento de MariaDB:
\`\`\`sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_connected';
\`\`\`

## 🔒 Seguridad

1. Cambiar contraseñas por defecto
2. Configurar firewall para puerto 3306
3. Usar SSL en producción
4. Configurar backups automáticos

## 📝 Notas Importantes

- La configuración actual usa SQLite para desarrollo
- Para producción, cambiar las variables de entorno
- Hacer backup de datos antes de migrar
- Probar en entorno de staging primero
`;

  const instructionsPath = path.join(process.cwd(), 'MARIADB_MIGRATION_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsPath, instructions);
  
  log(`✅ Instrucciones de migración generadas: ${instructionsPath}`, 'green');
  return instructionsPath;
}

function main() {
  log('🗄️  CONFIGURACIÓN DE MARIADB PARA PRODUCCIÓN', 'magenta');
  log('==============================================', 'magenta');
  
  try {
    // Generar archivos de configuración
    const sqlPath = generateMariaDBSetupSQL();
    const envPath = generateProductionEnv();
    const instructionsPath = generateMigrationInstructions();
    
    log('\n📋 ARCHIVOS GENERADOS:', 'blue');
    log(`   📄 SQL Setup: ${path.basename(sqlPath)}`, 'cyan');
    log(`   ⚙️  Configuración: ${path.basename(envPath)}`, 'cyan');
    log(`   📖 Instrucciones: ${path.basename(instructionsPath)}`, 'cyan');
    
    log('\n🚀 PRÓXIMOS PASOS:', 'blue');
    log('   1. Instalar MariaDB si no está instalado', 'yellow');
    log('   2. Ejecutar: mysql -u root -p < setup-mariadb.sql', 'yellow');
    log('   3. Copiar backend/.env.production a backend/.env', 'yellow');
    log('   4. Actualizar secretos y claves API en .env', 'yellow');
    log('   5. Ejecutar: node scripts/verify-mariadb-migration.cjs', 'yellow');
    
    log('\n✅ Configuración completada exitosamente!', 'green');
    log('📖 Lee MARIADB_MIGRATION_INSTRUCTIONS.md para instrucciones detalladas', 'green');
    
  } catch (error) {
    log(`❌ Error durante la configuración: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateMariaDBSetupSQL,
  generateProductionEnv,
  generateMigrationInstructions
};