#!/usr/bin/env node

/**
 * Script de deployment automatizado para Hostreamly
 * Despliega la aplicación en DigitalOcean App Platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function executeCommand(command, description) {
  try {
    log(`Ejecutando: ${command}`, 'blue');
    const result = execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    logSuccess(description);
    return result;
  } catch (error) {
    logError(`Error en: ${description}`);
    logError(error.message);
    process.exit(1);
  }
}

function checkPrerequisites() {
  logStep('1', 'Verificando prerequisitos...');
  
  // Verificar que doctl esté instalado
  try {
    execSync('doctl version', { stdio: 'pipe' });
    logSuccess('DigitalOcean CLI (doctl) está instalado');
  } catch (error) {
    logError('DigitalOcean CLI (doctl) no está instalado');
    log('Instala doctl desde: https://docs.digitalocean.com/reference/doctl/how-to/install/', 'yellow');
    process.exit(1);
  }
  
  // Verificar autenticación
  try {
    execSync('doctl auth list', { stdio: 'pipe' });
    logSuccess('Autenticación con DigitalOcean configurada');
  } catch (error) {
    logError('No estás autenticado con DigitalOcean');
    log('Ejecuta: doctl auth init', 'yellow');
    process.exit(1);
  }
  
  // Verificar archivos necesarios
  const requiredFiles = [
    '.do/app.yaml',
    'backend/.env.production',
    'backend/digitalocean-credentials.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      logError(`Archivo requerido no encontrado: ${file}`);
      process.exit(1);
    }
  }
  
  logSuccess('Todos los archivos requeridos están presentes');
}

function buildApplication() {
  logStep('2', 'Construyendo la aplicación...');
  
  // Limpiar builds anteriores
  if (fs.existsSync('dist')) {
    executeCommand('rm -rf dist', 'Limpiando build anterior');
  }
  
  // Instalar dependencias
  executeCommand('npm install', 'Instalando dependencias del frontend');
  
  // Build del frontend
  executeCommand('npm run build', 'Construyendo frontend para producción');
  
  // Instalar dependencias del backend
  process.chdir('backend');
  executeCommand('npm install --production', 'Instalando dependencias del backend');
  process.chdir('..');
  
  logSuccess('Aplicación construida exitosamente');
}

function deployToDigitalOcean() {
  logStep('3', 'Desplegando en DigitalOcean App Platform...');
  
  const appName = 'hostreamly';
  
  try {
    // Verificar si la app ya existe
    execSync(`doctl apps list | grep ${appName}`, { stdio: 'pipe' });
    log('Aplicación existente encontrada, actualizando...', 'yellow');
    executeCommand(`doctl apps update ${appName} --spec .do/app.yaml`, 'Actualizando aplicación');
  } catch (error) {
    // La app no existe, crear nueva
    log('Creando nueva aplicación...', 'yellow');
    executeCommand('doctl apps create --spec .do/app.yaml', 'Creando nueva aplicación');
  }
  
  logSuccess('Deployment iniciado en DigitalOcean');
}

function monitorDeployment() {
  logStep('4', 'Monitoreando el deployment...');
  
  log('Obteniendo información de la aplicación...', 'blue');
  executeCommand('doctl apps list', 'Listando aplicaciones');
  
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 DEPLOYMENT INICIADO EXITOSAMENTE', 'green');
  log('='.repeat(60), 'cyan');
  
  log('\nPróximos pasos:', 'yellow');
  log('1. Monitorea el progreso en: https://cloud.digitalocean.com/apps');
  log('2. El deployment puede tomar 5-10 minutos');
  log('3. Una vez completado, configura las variables de entorno en el panel');
  log('4. Verifica que la base de datos esté conectada');
  log('\nPara ver logs en tiempo real:', 'yellow');
  log('doctl apps logs <app-id> --follow', 'blue');
}

function main() {
  log('🚀 INICIANDO DEPLOYMENT DE HOSTREAMLY', 'bright');
  log('=====================================\n', 'bright');
  
  try {
    checkPrerequisites();
    buildApplication();
    deployToDigitalOcean();
    monitorDeployment();
  } catch (error) {
    logError('Deployment falló');
    logError(error.message);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };