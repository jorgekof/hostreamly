#!/usr/bin/env node

/**
 * Script maestro de deployment para Hostreamly
 * Automatiza todo el proceso de deployment a producción
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  log(`\n[PASO ${step}] ${message}`, 'cyan');
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function executeCommand(command, description, options = {}) {
  try {
    log(`Ejecutando: ${command}`, 'blue');
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    logSuccess(description);
    return result;
  } catch (error) {
    logError(`Error en: ${description}`);
    logError(error.message);
    if (!options.continueOnError) {
      process.exit(1);
    }
    return null;
  }
}

async function checkPrerequisites() {
  logStep('1', 'Verificando prerequisitos del sistema...');
  
  const checks = [
    {
      command: 'node --version',
      name: 'Node.js',
      required: true
    },
    {
      command: 'npm --version',
      name: 'NPM',
      required: true
    },
    {
      command: 'git --version',
      name: 'Git',
      required: true
    },
    {
      command: 'doctl version',
      name: 'DigitalOcean CLI',
      required: true
    }
  ];
  
  for (const check of checks) {
    try {
      const result = execSync(check.command, { stdio: 'pipe', encoding: 'utf8' });
      logSuccess(`${check.name}: ${result.trim().split('\n')[0]}`);
    } catch (error) {
      if (check.required) {
        logError(`${check.name} no está instalado o no está disponible`);
        if (check.name === 'DigitalOcean CLI') {
          logInfo('Instala doctl desde: https://docs.digitalocean.com/reference/doctl/how-to/install/');
        }
        process.exit(1);
      } else {
        logWarning(`${check.name} no está disponible (opcional)`);
      }
    }
  }
  
  // Verificar autenticación con DigitalOcean
  try {
    execSync('doctl auth list', { stdio: 'pipe' });
    logSuccess('Autenticación con DigitalOcean configurada');
  } catch (error) {
    logError('No estás autenticado con DigitalOcean');
    logInfo('Ejecuta: doctl auth init');
    process.exit(1);
  }
}

async function verifyConfiguration() {
  logStep('2', 'Verificando configuración del proyecto...');
  
  const requiredFiles = [
    { path: '.do/app.yaml', description: 'Configuración de DigitalOcean App Platform' },
    { path: 'backend/.env.production', description: 'Variables de entorno de producción' },
    { path: 'backend/digitalocean-credentials.js', description: 'Credenciales de DigitalOcean Spaces' },
    { path: 'package.json', description: 'Configuración del proyecto frontend' },
    { path: 'backend/package.json', description: 'Configuración del proyecto backend' }
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file.path)) {
      logSuccess(`${file.description}: ${file.path}`);
    } else {
      logError(`Archivo requerido no encontrado: ${file.path}`);
      logInfo(file.description);
      process.exit(1);
    }
  }
  
  // Verificar credenciales de DigitalOcean Spaces
  try {
    const credentialsPath = path.join(__dirname, 'backend', 'digitalocean-credentials.js');
    const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
    if (credentialsContent.includes('tu_access_key_aqui') || credentialsContent.includes('tu_secret_key_aqui')) {
      logWarning('Las credenciales de DigitalOcean Spaces contienen valores de ejemplo');
      logInfo('Actualiza el archivo backend/digitalocean-credentials.js con tus credenciales reales');
    } else {
      logSuccess('Credenciales de DigitalOcean Spaces configuradas');
    }
  } catch (error) {
    logError('Error leyendo credenciales de DigitalOcean Spaces');
    logInfo('Verifica el archivo backend/digitalocean-credentials.js');
  }
}

async function buildApplication() {
  logStep('3', 'Construyendo la aplicación...');
  
  // Limpiar builds anteriores
  if (fs.existsSync('dist')) {
    executeCommand('rm -rf dist', 'Limpiando build anterior del frontend');
  }
  
  // Instalar dependencias del frontend
  executeCommand('npm install', 'Instalando dependencias del frontend');
  
  // Build del frontend
  executeCommand('npm run build', 'Construyendo frontend para producción');
  
  // Verificar que el build se creó correctamente
  if (fs.existsSync('dist') && fs.existsSync('dist/index.html')) {
    logSuccess('Build del frontend creado exitosamente');
  } else {
    logError('El build del frontend no se creó correctamente');
    process.exit(1);
  }
  
  // Instalar dependencias del backend
  process.chdir('backend');
  executeCommand('npm install --production', 'Instalando dependencias del backend');
  process.chdir('..');
  
  logSuccess('Aplicación construida exitosamente');
}

async function setupGitRepository() {
  logStep('4', 'Configurando repositorio Git...');
  
  try {
    // Verificar si ya es un repositorio git
    execSync('git status', { stdio: 'pipe' });
    logSuccess('Repositorio Git ya existe');
  } catch (error) {
    // Inicializar repositorio git
    executeCommand('git init', 'Inicializando repositorio Git');
  }
  
  // Agregar archivos al repositorio
  executeCommand('git add .', 'Agregando archivos al repositorio');
  
  try {
    executeCommand('git commit -m "Preparando deployment a producción"', 'Creando commit para deployment');
  } catch (error) {
    logInfo('No hay cambios para commitear o ya están commiteados');
  }
}

async function deployToDigitalOcean() {
  logStep('5', 'Desplegando en DigitalOcean App Platform...');
  
  const appName = 'hostreamly';
  
  try {
    // Verificar si la app ya existe
    const result = execSync('doctl apps list --format Name', { stdio: 'pipe', encoding: 'utf8' });
    
    if (result.includes(appName)) {
      logInfo('Aplicación existente encontrada, actualizando...');
      
      // Obtener el ID de la app
      const appList = execSync('doctl apps list --format ID,Name', { stdio: 'pipe', encoding: 'utf8' });
      const lines = appList.split('\n');
      let appId = null;
      
      for (const line of lines) {
        if (line.includes(appName)) {
          appId = line.split('\t')[0].trim();
          break;
        }
      }
      
      if (appId) {
        executeCommand(`doctl apps update ${appId} --spec .do/app.yaml`, 'Actualizando aplicación existente');
      } else {
        logError('No se pudo obtener el ID de la aplicación');
        process.exit(1);
      }
    } else {
      logInfo('Creando nueva aplicación...');
      executeCommand('doctl apps create --spec .do/app.yaml', 'Creando nueva aplicación');
    }
    
    logSuccess('Deployment iniciado en DigitalOcean');
  } catch (error) {
    logError('Error durante el deployment');
    logError(error.message);
    process.exit(1);
  }
}

async function showPostDeploymentInfo() {
  logStep('6', 'Información post-deployment...');
  
  log('\n' + '='.repeat(70), 'cyan');
  log('🚀 DEPLOYMENT COMPLETADO EXITOSAMENTE', 'green');
  log('='.repeat(70), 'cyan');
  
  log('\n📋 Próximos pasos:', 'yellow');
  log('\n1. 🌐 Monitorea el progreso:', 'bright');
  log('   • Panel de DigitalOcean: https://cloud.digitalocean.com/apps', 'blue');
  log('   • El deployment puede tomar 5-15 minutos', 'blue');
  
  log('\n2. ⚙️  Configura las variables de entorno:', 'bright');
  log('   • Ve al panel de DigitalOcean Apps', 'blue');
  log('   • Sección "Settings" > "Environment Variables"', 'blue');
  log('   • Agrega las variables del archivo .env.production', 'blue');
  
  log('\n3. 🗄️  Configura la base de datos:', 'bright');
  log('   • Crea una base de datos MySQL en DigitalOcean', 'blue');
  log('   • Ejecuta: node setup-database.js', 'blue');
  log('   • Configura las variables DB_* en el panel', 'blue');
  
  log('\n4. 🔧 Comandos útiles:', 'bright');
  log('   • Ver logs: doctl apps logs <app-id> --follow', 'blue');
  log('   • Listar apps: doctl apps list', 'blue');
  log('   • Ver detalles: doctl apps get <app-id>', 'blue');
  
  log('\n5. ✅ Verificación:', 'bright');
  log('   • Espera a que el deployment termine', 'blue');
  log('   • Verifica que la aplicación esté accesible', 'blue');
  log('   • Prueba la funcionalidad de upload a DigitalOcean Spaces', 'blue');
  log('   • Verifica la conexión a la base de datos', 'blue');
  
  log('\n📚 Documentación adicional:', 'yellow');
  log('   • DEPLOYMENT_GUIDE.md - Guía completa de deployment', 'blue');
  log('   • CONFIGURAR_CREDENCIALES.md - Configuración de credenciales', 'blue');
  
  log('\n' + '='.repeat(70), 'cyan');
}

async function main() {
  log('🚀 HOSTREAMLY - DEPLOYMENT A PRODUCCIÓN', 'bright');
  log('========================================\n', 'bright');
  
  try {
    await checkPrerequisites();
    await verifyConfiguration();
    
    // Confirmar deployment
    const confirm = await askQuestion('\n¿Estás listo para desplegar a producción? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log('Deployment cancelado por el usuario', 'yellow');
      process.exit(0);
    }
    
    await buildApplication();
    await setupGitRepository();
    await deployToDigitalOcean();
    await showPostDeploymentInfo();
    
  } catch (error) {
    logError('Deployment falló');
    logError(error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };