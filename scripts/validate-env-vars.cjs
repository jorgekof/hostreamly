#!/usr/bin/env node

/**
 * Script de validación de variables de entorno
 * Verifica que las variables estén correctamente configuradas entre frontend y backend
 */

const fs = require('fs');
const path = require('path');
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      vars[key] = value;
    }
  });
  
  return vars;
}

function validateFrontendEnv() {
  log('\n🔍 Validando variables de entorno del Frontend...', 'blue');
  
  const frontendEnvPath = path.join(process.cwd(), '.env');
  const frontendVars = parseEnvFile(frontendEnvPath);
  
  if (!frontendVars) {
    log('❌ Archivo .env del frontend no encontrado', 'red');
    return false;
  }
  
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_API_TIMEOUT',
    'VITE_WEBSOCKET_URL',
    'VITE_BUNNY_STREAM_API_KEY',
    'VITE_BUNNY_STREAM_LIBRARY_ID',
    'VITE_BUNNY_CDN_HOSTNAME'
  ];
  
  let allValid = true;
  
  requiredVars.forEach(varName => {
    if (frontendVars[varName]) {
      log(`✅ ${varName}: ${frontendVars[varName]}`, 'green');
    } else {
      log(`❌ Variable faltante: ${varName}`, 'red');
      allValid = false;
    }
  });
  
  return allValid;
}

function validateBackendEnv() {
  log('\n🔍 Validando variables de entorno del Backend...', 'blue');
  
  const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
  const backendVars = parseEnvFile(backendEnvPath);
  
  if (!backendVars) {
    log('❌ Archivo .env del backend no encontrado', 'red');
    return false;
  }
  
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'FRONTEND_URL',
    'DB_HOST',
    'DB_NAME',
    'JWT_SECRET',
    'BUNNY_API_KEY',
    'BUNNY_STREAM_API_KEY',
    'BUNNY_STREAM_LIBRARY_ID'
  ];
  
  let allValid = true;
  
  requiredVars.forEach(varName => {
    if (backendVars[varName]) {
      // Ocultar valores sensibles
      const displayValue = ['JWT_SECRET', 'BUNNY_API_KEY', 'BUNNY_STREAM_API_KEY'].includes(varName) 
        ? '***' 
        : backendVars[varName];
      log(`✅ ${varName}: ${displayValue}`, 'green');
    } else {
      log(`❌ Variable faltante: ${varName}`, 'red');
      allValid = false;
    }
  });
  
  return allValid;
}

function validateConsistency() {
  log('\n🔄 Validando consistencia entre Frontend y Backend...', 'blue');
  
  const frontendVars = parseEnvFile(path.join(process.cwd(), '.env'));
  const backendVars = parseEnvFile(path.join(process.cwd(), 'backend', '.env'));
  
  if (!frontendVars || !backendVars) {
    log('❌ No se pueden comparar archivos faltantes', 'red');
    return false;
  }
  
  const consistencyChecks = [
    {
      frontend: 'VITE_BUNNY_STREAM_API_KEY',
      backend: 'BUNNY_STREAM_API_KEY',
      description: 'API Key de Bunny Stream'
    },
    {
      frontend: 'VITE_BUNNY_STREAM_LIBRARY_ID',
      backend: 'BUNNY_STREAM_LIBRARY_ID',
      description: 'Library ID de Bunny Stream'
    },
    {
      frontend: 'VITE_BUNNY_CDN_HOSTNAME',
      backend: 'BUNNY_CDN_HOSTNAME',
      description: 'Hostname del CDN de Bunny'
    }
  ];
  
  let allConsistent = true;
  
  consistencyChecks.forEach(check => {
    const frontendValue = frontendVars[check.frontend];
    const backendValue = backendVars[check.backend];
    
    if (frontendValue === backendValue) {
      log(`✅ ${check.description}: Consistente`, 'green');
    } else {
      log(`⚠️  ${check.description}: Inconsistente`, 'yellow');
      log(`   Frontend (${check.frontend}): ${frontendValue}`, 'yellow');
      log(`   Backend (${check.backend}): ${backendValue}`, 'yellow');
      allConsistent = false;
    }
  });
  
  return allConsistent;
}

function validateExampleFiles() {
  log('\n📋 Validando archivos de ejemplo...', 'blue');
  
  const exampleFiles = [
    { path: '.env.example', description: 'Frontend .env.example' },
    { path: '.env.production.example', description: 'Frontend .env.production.example' },
    { path: 'backend/.env.example', description: 'Backend .env.example' }
  ];
  
  let allExist = true;
  
  exampleFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file.path);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file.description}: Existe`, 'green');
    } else {
      log(`❌ ${file.description}: No encontrado`, 'red');
      allExist = false;
    }
  });
  
  return allExist;
}

function main() {
  log('🚀 Iniciando validación de variables de entorno...', 'blue');
  log('=' .repeat(60), 'blue');
  
  const frontendValid = validateFrontendEnv();
  const backendValid = validateBackendEnv();
  const consistent = validateConsistency();
  const examplesExist = validateExampleFiles();
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 RESUMEN DE VALIDACIÓN', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`Frontend: ${frontendValid ? '✅ Válido' : '❌ Inválido'}`, frontendValid ? 'green' : 'red');
  log(`Backend: ${backendValid ? '✅ Válido' : '❌ Inválido'}`, backendValid ? 'green' : 'red');
  log(`Consistencia: ${consistent ? '✅ Consistente' : '⚠️  Inconsistente'}`, consistent ? 'green' : 'yellow');
  log(`Archivos ejemplo: ${examplesExist ? '✅ Completos' : '❌ Faltantes'}`, examplesExist ? 'green' : 'red');
  
  const overallValid = frontendValid && backendValid && consistent && examplesExist;
  
  log('\n' + '='.repeat(60), 'blue');
  if (overallValid) {
    log('🎉 ¡Todas las variables de entorno están correctamente configuradas!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Se encontraron problemas en la configuración de variables de entorno.', 'yellow');
    log('📖 Consulta ENV_STANDARDIZATION.md para más información.', 'blue');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateFrontendEnv,
  validateBackendEnv,
  validateConsistency,
  validateExampleFiles
};