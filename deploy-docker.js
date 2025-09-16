#!/usr/bin/env node

/**
 * Script de despliegue con Docker para Hostreamly
 * Automatiza el proceso de build y deployment usando Docker Compose
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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

function execCommand(command, options = {}) {
  log(`Ejecutando: ${command}`, 'cyan');
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    log(`Error ejecutando comando: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkRequirements() {
  log('🔍 Verificando requisitos...', 'blue');
  
  try {
    execCommand('docker --version', { stdio: 'pipe' });
    log('✅ Docker instalado', 'green');
  } catch (error) {
    log('❌ Docker no está instalado o no está en el PATH', 'red');
    process.exit(1);
  }
  
  try {
    execCommand('docker-compose --version', { stdio: 'pipe' });
    log('✅ Docker Compose instalado', 'green');
  } catch (error) {
    log('❌ Docker Compose no está instalado', 'red');
    process.exit(1);
  }
}

function checkEnvFile(envFile) {
  if (!fs.existsSync(envFile)) {
    log(`⚠️  Archivo ${envFile} no encontrado`, 'yellow');
    log('Creando archivo de ejemplo...', 'yellow');
    
    const envExample = `# Configuración de Base de Datos
POSTGRES_DB=hostreamly
POSTGRES_USER=hostreamly_user
POSTGRES_PASSWORD=tu_password_seguro_aqui

# Redis
REDIS_PASSWORD=tu_redis_password_aqui

# JWT y Sesiones
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
SESSION_SECRET=tu_session_secret_aqui

# URLs de Producción
FRONTEND_URL=https://hostreamly.com
BACKEND_URL=https://api.hostreamly.com
ALLOWED_ORIGINS=https://hostreamly.com

# DigitalOcean Spaces
DO_SPACES_KEY=tu_spaces_key
DO_SPACES_SECRET=tu_spaces_secret
DO_SPACES_BUCKET=hostreamly-storage
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Bunny.net CDN
BUNNY_API_KEY=tu_bunny_api_key
BUNNY_STREAM_API_KEY=tu_bunny_stream_key
BUNNY_CDN_API_KEY=tu_bunny_cdn_key
BUNNY_STORAGE_ZONE=tu_storage_zone

# Frontend
VITE_API_URL=https://api.hostreamly.com
VITE_BUNNY_CDN_URL=https://tu-cdn.b-cdn.net
VITE_BUNNY_STREAM_URL=https://tu-stream.b-cdn.net`;
    
    fs.writeFileSync(envFile, envExample);
    log(`📝 Archivo ${envFile} creado. Por favor, configura las variables antes de continuar.`, 'yellow');
    return false;
  }
  
  log(`✅ Archivo ${envFile} encontrado`, 'green');
  return true;
}

function buildImages(environment = 'development') {
  log(`🏗️  Construyendo imágenes para ${environment}...`, 'blue');
  
  const composeFile = environment === 'production' 
    ? 'docker-compose.production.yml' 
    : 'docker-compose.yml';
  
  execCommand(`docker-compose -f ${composeFile} build --no-cache`);
  log('✅ Imágenes construidas exitosamente', 'green');
}

function deployServices(environment = 'development') {
  log(`🚀 Desplegando servicios en modo ${environment}...`, 'blue');
  
  const composeFile = environment === 'production' 
    ? 'docker-compose.production.yml' 
    : 'docker-compose.yml';
  
  // Detener servicios existentes
  log('🛑 Deteniendo servicios existentes...', 'yellow');
  execCommand(`docker-compose -f ${composeFile} down`, { stdio: 'pipe' });
  
  // Iniciar servicios
  log('▶️  Iniciando servicios...', 'blue');
  execCommand(`docker-compose -f ${composeFile} up -d`);
  
  // Esperar a que los servicios estén listos
  log('⏳ Esperando a que los servicios estén listos...', 'yellow');
  setTimeout(() => {
    execCommand(`docker-compose -f ${composeFile} ps`);
  }, 5000);
  
  log('✅ Servicios desplegados exitosamente', 'green');
}

function showStatus(environment = 'development') {
  const composeFile = environment === 'production' 
    ? 'docker-compose.production.yml' 
    : 'docker-compose.yml';
  
  log('📊 Estado de los servicios:', 'blue');
  execCommand(`docker-compose -f ${composeFile} ps`);
  
  log('\n📋 Logs recientes:', 'blue');
  execCommand(`docker-compose -f ${composeFile} logs --tail=20`);
}

function showUrls(environment = 'development') {
  log('\n🌐 URLs disponibles:', 'green');
  
  if (environment === 'development') {
    log('Frontend: http://localhost:3000', 'cyan');
    log('Backend API: http://localhost:3001', 'cyan');
    log('PostgreSQL: localhost:5432', 'cyan');
    log('Redis: localhost:6379', 'cyan');
  } else {
    log('Aplicación: http://localhost (Nginx)', 'cyan');
    log('API: http://localhost/api', 'cyan');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';
  const environment = args.includes('--prod') || args.includes('--production') ? 'production' : 'development';
  
  log(`🐳 Hostreamly Docker Deployment Script`, 'bright');
  log(`Modo: ${environment}`, 'magenta');
  log('=' * 50, 'blue');
  
  checkRequirements();
  
  const envFile = environment === 'production' ? '.env.production' : '.env';
  
  switch (command) {
    case 'deploy':
    case 'start':
      if (!checkEnvFile(envFile)) {
        process.exit(1);
      }
      buildImages(environment);
      deployServices(environment);
      showStatus(environment);
      showUrls(environment);
      break;
      
    case 'build':
      buildImages(environment);
      break;
      
    case 'up':
      if (!checkEnvFile(envFile)) {
        process.exit(1);
      }
      deployServices(environment);
      showUrls(environment);
      break;
      
    case 'down':
    case 'stop':
      const composeFile = environment === 'production' 
        ? 'docker-compose.production.yml' 
        : 'docker-compose.yml';
      execCommand(`docker-compose -f ${composeFile} down`);
      break;
      
    case 'status':
    case 'ps':
      showStatus(environment);
      break;
      
    case 'logs':
      const logComposeFile = environment === 'production' 
        ? 'docker-compose.production.yml' 
        : 'docker-compose.yml';
      execCommand(`docker-compose -f ${logComposeFile} logs -f`);
      break;
      
    case 'clean':
      log('🧹 Limpiando contenedores e imágenes...', 'yellow');
      execCommand('docker system prune -f');
      execCommand('docker volume prune -f');
      break;
      
    case 'help':
    default:
      log('\n📖 Comandos disponibles:', 'blue');
      log('  deploy, start    - Construir y desplegar (por defecto)', 'cyan');
      log('  build           - Solo construir imágenes', 'cyan');
      log('  up              - Solo iniciar servicios', 'cyan');
      log('  down, stop      - Detener servicios', 'cyan');
      log('  status, ps      - Ver estado de servicios', 'cyan');
      log('  logs            - Ver logs en tiempo real', 'cyan');
      log('  clean           - Limpiar contenedores e imágenes', 'cyan');
      log('  help            - Mostrar esta ayuda', 'cyan');
      log('\n🏷️  Opciones:', 'blue');
      log('  --prod, --production  - Usar configuración de producción', 'cyan');
      log('\n💡 Ejemplos:', 'blue');
      log('  node deploy-docker.js deploy', 'yellow');
      log('  node deploy-docker.js deploy --prod', 'yellow');
      log('  node deploy-docker.js logs', 'yellow');
      break;
  }
}

// Ejecutar main si este archivo es ejecutado directamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('deploy-docker.js')) {
  main();
}

export { main, checkRequirements, buildImages, deployServices };