#!/usr/bin/env node

/**
 * Script de Diagnóstico para DigitalOcean App Platform
 * Verifica configuración, build, y conectividad
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
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

function executeCommand(command, description, options = {}) {
  try {
    log(`Ejecutando: ${command}`, 'blue');
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    if (options.silent) {
      return result.trim();
    }
    logSuccess(description);
    return result;
  } catch (error) {
    if (options.continueOnError) {
      logWarning(`${description} - ${error.message}`);
      return null;
    }
    logError(`Error en: ${description}`);
    logError(error.message);
    return null;
  }
}

async function checkLocalBuild() {
  logStep('1', 'Verificando Build Local...');
  
  // Verificar que dist existe
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    logError('Carpeta dist no existe. Ejecuta: npm run build');
    return false;
  }
  
  // Verificar archivos principales
  const requiredFiles = ['index.html'];
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(distPath, file))
  );
  
  if (missingFiles.length > 0) {
    logError(`Archivos faltantes en dist: ${missingFiles.join(', ')}`);
    return false;
  }
  
  // Verificar tamaño del bundle
  const stats = fs.statSync(path.join(distPath, 'index.html'));
  logSuccess(`Build local verificado - index.html: ${stats.size} bytes`);
  
  // Listar assets
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assets = fs.readdirSync(assetsPath);
    logInfo(`Assets encontrados: ${assets.length} archivos`);
    assets.forEach(asset => {
      const assetStats = fs.statSync(path.join(assetsPath, asset));
      const sizeKB = (assetStats.size / 1024).toFixed(2);
      log(`  - ${asset}: ${sizeKB} KB`);
    });
  }
  
  return true;
}

async function checkDigitalOceanConfig() {
  logStep('2', 'Verificando Configuración de DigitalOcean...');
  
  // Verificar app.yaml
  const appYamlPath = path.join(process.cwd(), '.do', 'app.yaml');
  if (!fs.existsSync(appYamlPath)) {
    logError('Archivo .do/app.yaml no encontrado');
    return false;
  }
  
  const appYamlContent = fs.readFileSync(appYamlPath, 'utf8');
  
  // Verificar configuraciones críticas
  const checks = [
    {
      pattern: /error_document:\s*index\.html/,
      message: 'error_document configurado para SPA',
      critical: true
    },
    {
      pattern: /build_command:\s*npm.*build/,
      message: 'build_command configurado',
      critical: true
    },
    {
      pattern: /output_dir:\s*\/dist/,
      message: 'output_dir configurado correctamente',
      critical: true
    },
    {
      pattern: /REEMPLAZAR_CON_TU/,
      message: 'Variables de entorno sin configurar',
      critical: true,
      shouldNotMatch: true
    }
  ];
  
  let configValid = true;
  
  checks.forEach(check => {
    const matches = check.pattern.test(appYamlContent);
    const isValid = check.shouldNotMatch ? !matches : matches;
    
    if (isValid) {
      logSuccess(check.message);
    } else {
      if (check.critical) {
        logError(check.message);
        configValid = false;
      } else {
        logWarning(check.message);
      }
    }
  });
  
  return configValid;
}

async function checkDigitalOceanCLI() {
  logStep('3', 'Verificando DigitalOcean CLI...');
  
  // Verificar doctl instalado
  const doctlVersion = executeCommand('doctl version', 'doctl instalado', { 
    silent: true, 
    continueOnError: true 
  });
  
  if (!doctlVersion) {
    logError('doctl no está instalado');
    logInfo('Instala desde: https://docs.digitalocean.com/reference/doctl/how-to/install/');
    return false;
  }
  
  logSuccess(`doctl instalado: ${doctlVersion.split('\n')[0]}`);
  
  // Verificar autenticación
  const authList = executeCommand('doctl auth list', 'Verificando autenticación', { 
    silent: true, 
    continueOnError: true 
  });
  
  if (!authList) {
    logError('No estás autenticado con DigitalOcean');
    logInfo('Ejecuta: doctl auth init');
    return false;
  }
  
  logSuccess('Autenticación con DigitalOcean configurada');
  
  // Listar aplicaciones
  const appsList = executeCommand('doctl apps list --format Name,ID,Status', 'Listando aplicaciones', { 
    silent: true, 
    continueOnError: true 
  });
  
  if (appsList) {
    logInfo('Aplicaciones en DigitalOcean:');
    console.log(appsList);
  }
  
  return true;
}

async function checkConnectivity(url) {
  return new Promise((resolve) => {
    if (!url) {
      logWarning('URL no proporcionada para verificar conectividad');
      resolve(false);
      return;
    }
    
    const request = https.get(url, (response) => {
      logSuccess(`Conectividad OK - Status: ${response.statusCode}`);
      resolve(response.statusCode === 200);
    });
    
    request.on('error', (error) => {
      logError(`Error de conectividad: ${error.message}`);
      resolve(false);
    });
    
    request.setTimeout(10000, () => {
      logError('Timeout de conectividad (10s)');
      request.destroy();
      resolve(false);
    });
  });
}

async function generateReport() {
  logStep('5', 'Generando Reporte de Diagnóstico...');
  
  const report = {
    timestamp: new Date().toISOString(),
    localBuild: await checkLocalBuild(),
    digitalOceanConfig: await checkDigitalOceanConfig(),
    digitalOceanCLI: await checkDigitalOceanCLI(),
    recommendations: []
  };
  
  // Generar recomendaciones
  if (!report.localBuild) {
    report.recommendations.push('Ejecutar npm run build para generar el bundle');
  }
  
  if (!report.digitalOceanConfig) {
    report.recommendations.push('Corregir configuración en .do/app.yaml');
    report.recommendations.push('Configurar variables de entorno en DigitalOcean Dashboard');
  }
  
  if (!report.digitalOceanCLI) {
    report.recommendations.push('Instalar y configurar doctl CLI');
  }
  
  // Guardar reporte
  const reportPath = path.join(process.cwd(), 'digitalocean-diagnosis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Reporte guardado en: ${reportPath}`);
  
  // Mostrar resumen
  log('\n📊 RESUMEN DEL DIAGNÓSTICO', 'bright');
  log(`Local Build: ${report.localBuild ? '✅' : '❌'}`);
  log(`DO Config: ${report.digitalOceanConfig ? '✅' : '❌'}`);
  log(`DO CLI: ${report.digitalOceanCLI ? '✅' : '❌'}`);
  
  if (report.recommendations.length > 0) {
    log('\n🔧 RECOMENDACIONES:', 'yellow');
    report.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`);
    });
  }
  
  return report;
}

async function main() {
  log('🔍 DIAGNÓSTICO DE DIGITALOCEAN APP PLATFORM', 'bright');
  log('='.repeat(50), 'cyan');
  
  try {
    const report = await generateReport();
    
    if (report.localBuild && report.digitalOceanConfig && report.digitalOceanCLI) {
      log('\n🎉 Configuración parece correcta. Verificar logs en DigitalOcean Dashboard.', 'green');
    } else {
      log('\n⚠️  Se encontraron problemas. Revisar recomendaciones arriba.', 'yellow');
    }
    
  } catch (error) {
    logError(`Error durante el diagnóstico: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;