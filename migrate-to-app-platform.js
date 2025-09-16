#!/usr/bin/env node

/**
 * Script de migración de Droplet a DigitalOcean App Platform
 * Para Hostreamly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description, options = {}) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    log(`Ejecutando: ${command}`, 'cyan');
    
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options
    });
    
    log(`✅ ${description} completado`, 'green');
    return result;
  } catch (error) {
    log(`❌ Error en: ${description}`, 'red');
    log(`Error: ${error.message}`, 'red');
    if (!options.continueOnError) {
      throw error;
    }
    return null;
  }
}

function checkPrerequisites() {
  log('\n🔍 Verificando prerequisitos...', 'magenta');
  
  // Verificar que doctl esté instalado
  try {
    executeCommand('.\\doctl.exe version', 'Verificando doctl CLI', { silent: true });
  } catch (error) {
    log('❌ doctl CLI no está instalado o configurado', 'red');
    log('Por favor instala doctl y configúralo con: doctl auth init', 'yellow');
    process.exit(1);
  }
  
  // Verificar archivos necesarios
  const requiredFiles = [
    '.do/app-migration.yaml',
    'package.json',
    'backend/package.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Archivo requerido no encontrado: ${file}`, 'red');
      process.exit(1);
    }
  }
  
  log('✅ Todos los prerequisitos están listos', 'green');
}

function updateConfiguration() {
  log('\n📝 Configurando variables de entorno...', 'magenta');
  
  // Leer configuración actual
  const configPath = '.do/app-migration.yaml';
  let config = fs.readFileSync(configPath, 'utf8');
  
  log('\n⚠️  IMPORTANTE: Necesitas configurar las siguientes variables:', 'yellow');
  log('1. DO_SPACES_KEY - Tu Access Key de DigitalOcean Spaces', 'yellow');
  log('2. DO_SPACES_SECRET - Tu Secret Key de DigitalOcean Spaces', 'yellow');
  log('3. DO_SPACES_BUCKET - Nombre de tu bucket', 'yellow');
  log('4. BUNNY_API_KEY - Tu API Key de Bunny.net', 'yellow');
  log('\nPuedes editarlas en: .do/app-migration.yaml', 'cyan');
  
  return config;
}

function createApp() {
  log('\n🚀 Creando aplicación en App Platform...', 'magenta');
  
  try {
    // Crear la aplicación
    const configPath = path.join(__dirname, '.do', 'app-migration.yaml');
    const result = executeCommand(
      `.\\doctl.exe apps create --spec ${configPath} --format ID --no-header`,
      'Creando aplicación en DigitalOcean App Platform',
      { silent: true }
    );
    
    const appId = result.trim();
    log(`\n✅ Aplicación creada con ID: ${appId}`, 'green');
    
    // Guardar el ID para referencia futura
    fs.writeFileSync('.app-id', appId);
    
    return appId;
  } catch (error) {
    log('❌ Error creando la aplicación', 'red');
    log('Verifica que tu configuración YAML sea válida', 'yellow');
    throw error;
  }
}

function monitorDeployment(appId) {
  log('\n👀 Monitoreando el despliegue...', 'magenta');
  
  let attempts = 0;
  const maxAttempts = 30; // 15 minutos máximo
  
  const checkStatus = () => {
    try {
      const result = executeCommand(
        `.\\doctl.exe apps get ${appId} --format Phase --no-header`,
        'Verificando estado del despliegue',
        { silent: true }
      );
      
      const phase = result.trim();
      log(`Estado actual: ${phase}`, 'cyan');
      
      if (phase === 'ACTIVE') {
        log('\n🎉 ¡Despliegue completado exitosamente!', 'green');
        return true;
      } else if (phase === 'ERROR' || phase === 'CANCELED') {
        log('\n❌ El despliegue falló', 'red');
        return false;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        log('\n⏰ Tiempo de espera agotado', 'yellow');
        return false;
      }
      
      // Esperar 30 segundos antes del siguiente check
      setTimeout(checkStatus, 30000);
      
    } catch (error) {
      log('Error verificando estado', 'red');
      return false;
    }
  };
  
  checkStatus();
}

function showResults(appId) {
  log('\n📊 Obteniendo información de la aplicación...', 'magenta');
  
  try {
    const result = executeCommand(
      `.\\doctl.exe apps get ${appId}`,
      'Obteniendo detalles de la aplicación',
      { silent: true }
    );
    
    log('\n🌐 URLs de tu aplicación:', 'green');
    
    // Extraer URLs del resultado
    const lines = result.split('\n');
    lines.forEach(line => {
      if (line.includes('https://')) {
        const url = line.match(/https:\/\/[^\s]+/);
        if (url) {
          log(`   ${url[0]}`, 'cyan');
        }
      }
    });
    
  } catch (error) {
    log('Error obteniendo información de la aplicación', 'red');
  }
}

function showMigrationInstructions() {
  log('\n📋 Próximos pasos para completar la migración:', 'magenta');
  log('\n1. 🔧 Configurar variables de entorno:', 'yellow');
  log('   - Edita .do/app-migration.yaml con tus credenciales reales', 'cyan');
  log('   - Actualiza la aplicación: doctl apps update <APP_ID> .do/app-migration.yaml', 'cyan');
  
  log('\n2. 🌐 Configurar dominio (opcional):', 'yellow');
  log('   - Agrega tu dominio personalizado en el panel de DigitalOcean', 'cyan');
  log('   - Actualiza los registros DNS para apuntar a App Platform', 'cyan');
  
  log('\n3. 🗄️ Migrar datos:', 'yellow');
  log('   - Exporta datos del droplet actual', 'cyan');
  log('   - Importa a la base de datos managed de App Platform', 'cyan');
  
  log('\n4. 🧪 Probar la aplicación:', 'yellow');
  log('   - Verifica que todas las funcionalidades trabajen correctamente', 'cyan');
  log('   - Realiza pruebas de carga si es necesario', 'cyan');
  
  log('\n5. 🗑️ Limpiar recursos:', 'yellow');
  log('   - Una vez confirmado el funcionamiento, elimina el droplet', 'cyan');
  log('   - Cancela servicios no utilizados', 'cyan');
  
  log('\n💡 Comandos útiles:', 'green');
  log('   - Ver logs: doctl apps logs <APP_ID>', 'cyan');
  log('   - Ver estado: doctl apps get <APP_ID>', 'cyan');
  log('   - Actualizar: doctl apps update <APP_ID> .do/app-migration.yaml', 'cyan');
}

async function main() {
  try {
    log('🌊 Iniciando migración de Droplet a App Platform', 'magenta');
    log('=' .repeat(50), 'blue');
    
    checkPrerequisites();
    updateConfiguration();
    
    const appId = createApp();
    
    log('\n⏳ El despliegue puede tomar varios minutos...', 'yellow');
    monitorDeployment(appId);
    
    showResults(appId);
    showMigrationInstructions();
    
    log('\n🎉 ¡Migración iniciada exitosamente!', 'green');
    log(`App ID: ${appId}`, 'cyan');
    
  } catch (error) {
    log('\n❌ Error durante la migración:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Ejecutar la migración
main().catch(console.error);

export { main };