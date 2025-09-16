#!/usr/bin/env node

/**
 * Script de deployment simplificado para Hostreamly
 * Versión optimizada para Windows
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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    log(`Ejecutando: ${command}`, 'cyan');
    
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    log(`✅ ${description} completado`, 'green');
    return result;
  } catch (error) {
    log(`❌ Error en: ${description}`, 'red');
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

function checkFiles() {
  log('\n📋 Verificando archivos necesarios...', 'cyan');
  
  const requiredFiles = [
    '.do/app.yaml',
    'backend/.env.production',
    'package.json'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ Archivo faltante: ${file}`, 'red');
      throw new Error(`Archivo requerido no encontrado: ${file}`);
    }
  }
}

function buildApp() {
  log('\n🏗️  Construyendo aplicación...', 'cyan');
  
  // Limpiar build anterior
  if (fs.existsSync('dist')) {
    executeCommand('rmdir /s /q dist', 'Limpiando build anterior');
  }
  
  // Build del frontend
  executeCommand('npm run build', 'Construyendo frontend');
  
  // Verificar build
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('Build del frontend falló');
  }
  
  log('✅ Build completado exitosamente', 'green');
}

function deployApp() {
  log('\n🚀 Desplegando en DigitalOcean...', 'cyan');
  
  try {
    // Verificar si doctl está disponible
    executeCommand('.\\doctl.exe version', 'Verificando DigitalOcean CLI');
      
      // Verificar autenticación
      executeCommand('.\\doctl.exe auth list', 'Verificando autenticación');
      
      // Crear o actualizar app
      try {
        executeCommand('.\\doctl.exe apps create --spec .do/app.yaml', 'Creando aplicación');
      } catch (error) {
        if (error.message.includes('already exists')) {
          log('⚠️  Aplicación ya existe, actualizando...', 'yellow');
          // Obtener lista de apps y actualizar
          const appsList = execSync('.\\doctl.exe apps list --format ID,Name', { encoding: 'utf8' });
          const lines = appsList.split('\n');
          let appId = null;
          
          for (const line of lines) {
            if (line.includes('hostreamly')) {
              appId = line.split(/\s+/)[0];
              break;
            }
          }
          
          if (appId) {
            executeCommand(`.\\doctl.exe apps update ${appId} --spec .do/app.yaml`, 'Actualizando aplicación');
        } else {
          throw new Error('No se pudo encontrar el ID de la aplicación');
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    log('❌ Error en deployment:', 'red');
    log('💡 Asegúrate de que:', 'yellow');
    log('   • doctl esté instalado y configurado', 'yellow');
    log('   • Estés autenticado: doctl auth init', 'yellow');
    log('   • Las credenciales sean correctas', 'yellow');
    throw error;
  }
}

function showResults() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 DEPLOYMENT COMPLETADO', 'green');
  log('='.repeat(60), 'cyan');
  
  log('\n📋 Próximos pasos:', 'yellow');
  log('1. Ve a: https://cloud.digitalocean.com/apps', 'blue');
  log('2. Configura las variables de entorno', 'blue');
  log('3. Espera a que termine el deployment (5-10 min)', 'blue');
  log('4. Verifica que la app esté funcionando', 'blue');
  
  log('\n🔧 Comandos útiles:', 'yellow');
   log('• Ver apps: .\\doctl.exe apps list', 'blue');
    log('• Ver logs: .\\doctl.exe apps logs <app-id> --follow', 'blue');
}

async function main() {
  try {
    log('🚀 HOSTREAMLY - DEPLOYMENT SIMPLIFICADO', 'cyan');
    log('========================================\n', 'cyan');
    
    checkFiles();
    buildApp();
    deployApp();
    showResults();
    
  } catch (error) {
    log('\n❌ DEPLOYMENT FALLÓ', 'red');
    log(`Error: ${error.message}`, 'red');
    
    log('\n💡 Soluciones posibles:', 'yellow');
    log('• Verifica que doctl esté instalado', 'blue');
    log('• Ejecuta: .\\doctl.exe auth init', 'blue');
    log('• Revisa las credenciales en backend/digitalocean-credentials.js', 'blue');
    log('• Verifica la conexión a internet', 'blue');
    
    process.exit(1);
  }
}

// Ejecutar directamente
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

export { main };