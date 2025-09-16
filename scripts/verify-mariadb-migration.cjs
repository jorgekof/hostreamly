#!/usr/bin/env node

/**
 * Script de Verificación de Migración a MariaDB
 * 
 * Este script verifica que la migración de Supabase a MariaDB se haya completado correctamente.
 * Comprueba:
 * - Configuración de base de datos
 * - Eliminación de referencias a Supabase
 * - Funcionamiento de la API
 * - Conectividad con MariaDB
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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - No encontrado`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchTerm, shouldExist = false) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Archivo no encontrado: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasContent = content.includes(searchTerm);
  
  if (shouldExist && hasContent) {
    log(`✅ ${path.basename(filePath)} contiene: ${searchTerm}`, 'green');
    return true;
  } else if (!shouldExist && !hasContent) {
    log(`✅ ${path.basename(filePath)} NO contiene: ${searchTerm}`, 'green');
    return true;
  } else {
    const status = shouldExist ? 'debería contener' : 'NO debería contener';
    log(`❌ ${path.basename(filePath)} ${status}: ${searchTerm}`, 'red');
    return false;
  }
}

function checkDatabaseConfig() {
  log('\n🗄️  Verificando configuración de MariaDB...', 'blue');
  
  const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
  
  if (!checkFile(backendEnvPath, 'Archivo .env del backend')) {
    return false;
  }
  
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const checks = [
    { key: 'DB_DIALECT=mariadb', description: 'Dialecto MariaDB configurado' },
    { key: 'DB_HOST=', description: 'Host de base de datos configurado' },
    { key: 'DB_NAME=', description: 'Nombre de base de datos configurado' },
    { key: 'DB_USER=', description: 'Usuario de base de datos configurado' }
  ];
  
  let allChecksPass = true;
  
  checks.forEach(check => {
    if (envContent.includes(check.key)) {
      log(`✅ ${check.description}`, 'green');
    } else {
      log(`❌ ${check.description}`, 'red');
      allChecksPass = false;
    }
  });
  
  return allChecksPass;
}

function checkSupabaseReferences() {
  log('\n🔍 Verificando eliminación de referencias a Supabase...', 'blue');
  
  const criticalFiles = [
    'src/lib/supabase.ts',
    'src/types/supabase.ts',
    'src/lib/api.ts'
  ];
  
  let allChecksPass = true;
  
  criticalFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    if (file === 'src/lib/supabase.ts') {
      // Este archivo debe existir pero con contenido de API
      if (checkFile(filePath, `${file} (reemplazado con API)`)) {
        checkFileContent(filePath, 'SupabaseCompatibleAPI', true);
        checkFileContent(filePath, '@/integrations/supabase/client', false);
      } else {
        allChecksPass = false;
      }
    } else if (file === 'src/types/supabase.ts') {
      // Este archivo debe existir con tipos de backend
      if (checkFile(filePath, `${file} (tipos de backend)`)) {
        checkFileContent(filePath, 'Backend API Types', true);
      } else {
        allChecksPass = false;
      }
    } else {
      if (!checkFile(filePath, file)) {
        allChecksPass = false;
      }
    }
  });
  
  return allChecksPass;
}

function checkBackendDependencies() {
  log('\n📦 Verificando dependencias del backend...', 'blue');
  
  const packageJsonPath = path.join(process.cwd(), 'backend', 'package.json');
  
  if (!checkFile(packageJsonPath, 'package.json del backend')) {
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    'sequelize',
    'mariadb',
    'mysql2',
    'express',
    'jsonwebtoken'
  ];
  
  let allDepsPresent = true;
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      log(`✅ Dependencia encontrada: ${dep}`, 'green');
    } else {
      log(`❌ Dependencia faltante: ${dep}`, 'red');
      allDepsPresent = false;
    }
  });
  
  return allDepsPresent;
}

function checkFrontendConfig() {
  log('\n⚛️  Verificando configuración del frontend...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (!checkFile(envPath, 'Archivo .env del frontend')) {
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_API_TIMEOUT',
    'VITE_BUNNY_STREAM_API_KEY'
  ];
  
  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      log(`✅ Variable de entorno configurada: ${varName}`, 'green');
    } else {
      log(`❌ Variable de entorno faltante: ${varName}`, 'red');
      allVarsPresent = false;
    }
  });
  
  // Verificar que no haya variables de Supabase
  const supabaseVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  
  supabaseVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      log(`✅ Variable de Supabase eliminada: ${varName}`, 'green');
    } else {
      log(`⚠️  Variable de Supabase aún presente: ${varName}`, 'yellow');
    }
  });
  
  return allVarsPresent;
}

function testDatabaseConnection() {
  log('\n🔌 Probando conexión a la base de datos...', 'blue');
  
  try {
    // Cambiar al directorio del backend
    process.chdir(path.join(process.cwd(), 'backend'));
    
    // Intentar ejecutar un script de prueba de conexión
    const testScript = `
      const { Sequelize } = require('sequelize');
      require('dotenv').config();
      
      const sequelize = new Sequelize({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dialect: process.env.DB_DIALECT || 'mariadb',
        logging: false
      });
      
      sequelize.authenticate()
        .then(() => {
          console.log('✅ Conexión a MariaDB exitosa');
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Error de conexión a MariaDB:', err.message);
          process.exit(1);
        });
    `;
    
    fs.writeFileSync('test-connection.js', testScript);
    execSync('node test-connection.js', { stdio: 'inherit' });
    fs.unlinkSync('test-connection.js');
    
    return true;
  } catch (error) {
    log(`❌ Error al probar la conexión: ${error.message}`, 'red');
    log('💡 Asegúrate de que MariaDB esté ejecutándose y las credenciales sean correctas', 'yellow');
    return false;
  } finally {
    // Volver al directorio raíz
    process.chdir('..');
  }
}

function generateMigrationReport() {
  log('\n📋 Generando reporte de migración...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    database: checkDatabaseConfig(),
    supabaseReferences: checkSupabaseReferences(),
    backendDependencies: checkBackendDependencies(),
    frontendConfig: checkFrontendConfig(),
    databaseConnection: testDatabaseConnection()
  };
  
  const reportPath = path.join(process.cwd(), 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📄 Reporte guardado en: ${reportPath}`, 'cyan');
  
  return report;
}

function main() {
  log('🚀 VERIFICACIÓN DE MIGRACIÓN SUPABASE → MARIADB', 'magenta');
  log('================================================', 'magenta');
  
  const report = generateMigrationReport();
  
  const allChecksPass = Object.values(report).every(check => 
    typeof check === 'boolean' ? check : true
  );
  
  log('\n📊 RESUMEN DE VERIFICACIÓN', 'blue');
  log('==========================', 'blue');
  
  Object.entries(report).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      const status = value ? '✅ PASÓ' : '❌ FALLÓ';
      const color = value ? 'green' : 'red';
      log(`${key}: ${status}`, color);
    }
  });
  
  if (allChecksPass) {
    log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!', 'green');
    log('Todos los componentes están funcionando correctamente con MariaDB.', 'green');
  } else {
    log('\n⚠️  MIGRACIÓN INCOMPLETA', 'yellow');
    log('Algunos componentes necesitan atención. Revisa los errores arriba.', 'yellow');
  }
  
  process.exit(allChecksPass ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDatabaseConfig,
  checkSupabaseReferences,
  checkBackendDependencies,
  checkFrontendConfig,
  testDatabaseConnection
};