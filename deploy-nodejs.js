#!/usr/bin/env node

/**
 * Script de despliegue nativo con Node.js para Hostreamly
 * Alternativa sin Docker que usa procesos Node.js directos
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
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

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log('❌ Se requiere Node.js 16 o superior', 'red');
    log(`Versión actual: ${nodeVersion}`, 'yellow');
    process.exit(1);
  }
  
  log(`✅ Node.js ${nodeVersion} detectado`, 'green');
}

async function checkRequirements() {
  log('🔍 Verificando requisitos...', 'blue');
  
  checkNodeVersion();
  
  // Verificar npm
  try {
    const { stdout } = await execAsync('npm --version');
    log(`✅ npm ${stdout.trim()} disponible`, 'green');
  } catch (error) {
    log('❌ npm no está disponible', 'red');
    process.exit(1);
  }
}

async function installDependencies() {
  log('📦 Instalando dependencias...', 'blue');
  
  // Backend dependencies
  log('📦 Instalando dependencias del backend...', 'cyan');
  try {
    await execAsync('npm install', { cwd: path.join(__dirname, 'backend') });
    log('✅ Dependencias del backend instaladas', 'green');
  } catch (error) {
    log('❌ Error instalando dependencias del backend', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
  
  // Frontend dependencies
  log('📦 Instalando dependencias del frontend...', 'cyan');
  try {
    await execAsync('npm install', { cwd: __dirname });
    log('✅ Dependencias del frontend instaladas', 'green');
  } catch (error) {
    log('❌ Error instalando dependencias del frontend', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

async function setupDatabase() {
  log('🗄️  Configurando base de datos SQLite...', 'blue');
  
  const dbPath = path.join(__dirname, 'backend', 'hostreamly.db');
  
  if (!fs.existsSync(dbPath)) {
    log('📝 Creando base de datos SQLite...', 'cyan');
    try {
      // Ejecutar script de configuración de base de datos
      await execAsync('node setup-database.js', { cwd: __dirname });
      log('✅ Base de datos SQLite creada', 'green');
    } catch (error) {
      log('⚠️  Continuando sin configuración automática de BD', 'yellow');
    }
  } else {
    log('✅ Base de datos SQLite ya existe', 'green');
  }
}

function startBackend() {
  return new Promise((resolve, reject) => {
    log('🚀 Iniciando servidor backend...', 'blue');
    
    const backend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let started = false;
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on') || output.includes('listening on')) {
        if (!started) {
          log('✅ Backend iniciado en http://localhost:3001', 'green');
          started = true;
          resolve(backend);
        }
      }
      // Mostrar logs del backend con prefijo
      output.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[Backend] ${line}`, 'cyan');
        }
      });
    });
    
    backend.stderr.on('data', (data) => {
      const error = data.toString();
      error.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[Backend Error] ${line}`, 'red');
        }
      });
    });
    
    backend.on('error', (error) => {
      log(`❌ Error iniciando backend: ${error.message}`, 'red');
      reject(error);
    });
    
    // Timeout si no inicia en 30 segundos
    setTimeout(() => {
      if (!started) {
        log('⚠️  Backend tardando en iniciar, continuando...', 'yellow');
        resolve(backend);
      }
    }, 30000);
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    log('🎨 Iniciando servidor frontend...', 'blue');
    
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let started = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost')) {
        if (!started) {
          // Extraer URL del output
          const urlMatch = output.match(/https?:\/\/localhost:\d+/);
          const url = urlMatch ? urlMatch[0] : 'http://localhost:5173';
          log(`✅ Frontend iniciado en ${url}`, 'green');
          started = true;
          resolve({ process: frontend, url });
        }
      }
      // Mostrar logs del frontend con prefijo
      output.split('\n').forEach(line => {
        if (line.trim() && !line.includes('➜')) {
          log(`[Frontend] ${line}`, 'magenta');
        }
      });
    });
    
    frontend.stderr.on('data', (data) => {
      const error = data.toString();
      error.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[Frontend Error] ${line}`, 'red');
        }
      });
    });
    
    frontend.on('error', (error) => {
      log(`❌ Error iniciando frontend: ${error.message}`, 'red');
      reject(error);
    });
    
    // Timeout si no inicia en 30 segundos
    setTimeout(() => {
      if (!started) {
        log('⚠️  Frontend tardando en iniciar, continuando...', 'yellow');
        resolve({ process: frontend, url: 'http://localhost:5173' });
      }
    }, 30000);
  });
}

function showStatus(frontendUrl) {
  log('\n🌐 Aplicación desplegada exitosamente!', 'bright');
  log('=' * 50, 'blue');
  log('📱 Frontend: ' + frontendUrl, 'cyan');
  log('🔧 Backend API: http://localhost:3001', 'cyan');
  log('📊 Base de datos: SQLite (local)', 'cyan');
  log('\n💡 Comandos útiles:', 'blue');
  log('  Ctrl+C - Detener servidores', 'yellow');
  log('  npm run build - Construir para producción', 'yellow');
  log('  npm test - Ejecutar pruebas', 'yellow');
  log('\n🔗 URLs de prueba:', 'blue');
  log('  API Health: http://localhost:3001/health', 'cyan');
  log('  API Docs: http://localhost:3001/api-docs', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  log('🚀 Hostreamly Node.js Deployment Script', 'bright');
  log('Modo: Desarrollo nativo (sin Docker)', 'magenta');
  log('=' * 50, 'blue');
  
  try {
    switch (command) {
      case 'start':
      case 'dev':
        await checkRequirements();
        await installDependencies();
        await setupDatabase();
        
        // Iniciar backend
        const backendProcess = await startBackend();
        
        // Esperar un poco antes de iniciar frontend
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Iniciar frontend
        const { process: frontendProcess, url: frontendUrl } = await startFrontend();
        
        // Mostrar estado
        setTimeout(() => showStatus(frontendUrl), 2000);
        
        // Manejar cierre graceful
        process.on('SIGINT', () => {
          log('\n🛑 Deteniendo servidores...', 'yellow');
          backendProcess.kill('SIGTERM');
          frontendProcess.kill('SIGTERM');
          process.exit(0);
        });
        
        // Mantener el proceso vivo
        process.stdin.resume();
        break;
        
      case 'install':
        await checkRequirements();
        await installDependencies();
        log('✅ Dependencias instaladas correctamente', 'green');
        break;
        
      case 'setup':
        await checkRequirements();
        await setupDatabase();
        log('✅ Base de datos configurada', 'green');
        break;
        
      case 'build':
        log('🏗️  Construyendo aplicación para producción...', 'blue');
        await execAsync('npm run build', { cwd: __dirname });
        log('✅ Build completado en ./dist', 'green');
        break;
        
      case 'help':
      default:
        log('\n📖 Comandos disponibles:', 'blue');
        log('  start, dev      - Iniciar aplicación completa (por defecto)', 'cyan');
        log('  install         - Solo instalar dependencias', 'cyan');
        log('  setup          - Solo configurar base de datos', 'cyan');
        log('  build          - Construir para producción', 'cyan');
        log('  help           - Mostrar esta ayuda', 'cyan');
        log('\n💡 Ejemplos:', 'blue');
        log('  node deploy-nodejs.js start', 'yellow');
        log('  node deploy-nodejs.js build', 'yellow');
        break;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('deploy-nodejs.js')) {
  main();
}

export { main, checkRequirements, installDependencies, setupDatabase, startBackend, startFrontend };