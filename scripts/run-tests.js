#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración de colores para la consola
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

function logHeader(message) {
  const border = '='.repeat(60);
  log(border, 'cyan');
  log(`🐰 ${message}`, 'bright');
  log(border, 'cyan');
}

function logStep(step, message) {
  log(`${step}. ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Ejecutando: ${command} ${args.join(' ')}`, 'cyan');
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Directorio creado: ${dirPath}`, 'green');
  }
}

function getTestSuites() {
  return [
    {
      name: 'Autenticación',
      file: 'auth-flow.spec.ts',
      description: 'Pruebas de registro, login y logout'
    },
    {
      name: 'Editor de Video',
      file: 'video-editor.spec.ts',
      description: 'Funcionalidad completa del editor'
    },
    {
      name: 'Navegación Completa',
      file: 'full-navigation.spec.ts',
      description: 'Simulación de usuario real'
    },
    {
      name: 'Rendimiento',
      file: 'performance.spec.ts',
      description: 'Métricas de velocidad y memoria'
    },
    {
      name: 'Bot de Usuario',
      file: 'user-simulation-bot.spec.ts',
      description: 'Automatización avanzada'
    }
  ];
}

async function checkPrerequisites() {
  logStep(1, 'Verificando prerequisitos...');
  
  // Verificar que Playwright esté instalado
  try {
    await runCommand('npx', ['playwright', '--version']);
    logSuccess('Playwright instalado correctamente');
  } catch (error) {
    logError('Playwright no está instalado');
    throw error;
  }

  // Verificar que el servidor de desarrollo esté disponible
  try {
    const response = await fetch('http://localhost:5173');
    if (response.ok) {
      logSuccess('Servidor de desarrollo disponible en http://localhost:5173');
    } else {
      logWarning('Servidor de desarrollo no responde correctamente');
    }
  } catch (error) {
    logWarning('Servidor de desarrollo no está ejecutándose');
    logWarning('Asegúrate de ejecutar "npm run dev" en otra terminal');
  }

  // Crear directorios necesarios
  ensureDirectory('test-results');
  ensureDirectory('test-results/screenshots');
  ensureDirectory('test-results/videos');
}

async function runTestSuite(suite, options = {}) {
  const { headless = true, browser = 'chromium' } = options;
  
  logStep('▶️', `Ejecutando suite: ${suite.name}`);
  log(`   📝 ${suite.description}`, 'magenta');
  
  const args = [
    'playwright', 'test',
    `tests/${suite.file}`,
    `--project=${browser}`,
    headless ? '--headed' : '',
    '--reporter=list'
  ].filter(Boolean);

  try {
    await runCommand('npx', args);
    logSuccess(`Suite completada: ${suite.name}`);
    return true;
  } catch (error) {
    logError(`Suite falló: ${suite.name} - ${error.message}`);
    return false;
  }
}

async function runAllTests(options = {}) {
  const suites = getTestSuites();
  const results = [];
  
  logHeader('EJECUTANDO TODAS LAS SUITES DE PRUEBA');
  
  for (const suite of suites) {
    const success = await runTestSuite(suite, options);
    results.push({ suite: suite.name, success });
    
    // Pausa entre suites para evitar sobrecarga
    if (suite !== suites[suites.length - 1]) {
      log('⏳ Pausa de 2 segundos...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

async function generateFinalReport(results) {
  logHeader('GENERANDO REPORTE FINAL');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = ((successful / total) * 100).toFixed(1);
  
  log(`📊 Resumen de Ejecución:`, 'bright');
  log(`   Total de suites: ${total}`);
  log(`   Exitosas: ${successful}`, 'green');
  log(`   Fallidas: ${total - successful}`, 'red');
  log(`   Tasa de éxito: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');
  
  // Mostrar detalles por suite
  log('\n📋 Detalle por suite:', 'bright');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`   ${status} ${result.suite}`, color);
  });
  
  // Generar archivo de resumen
  const summary = {
    timestamp: new Date().toISOString(),
    totalSuites: total,
    successfulSuites: successful,
    failedSuites: total - successful,
    successRate: parseFloat(successRate),
    results: results,
    recommendations: generateRecommendations(results, successRate)
  };
  
  const summaryPath = path.join('test-results', 'execution-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  logSuccess(`Resumen guardado en: ${summaryPath}`);
  
  // Mostrar recomendaciones
  if (summary.recommendations.length > 0) {
    log('\n💡 Recomendaciones:', 'yellow');
    summary.recommendations.forEach(rec => {
      log(`   • ${rec}`, 'yellow');
    });
  }
}

function generateRecommendations(results, successRate) {
  const recommendations = [];
  
  if (successRate < 70) {
    recommendations.push('Revisar configuración básica del proyecto');
    recommendations.push('Verificar que el servidor de desarrollo esté funcionando');
  }
  
  if (successRate < 90) {
    recommendations.push('Revisar tests fallidos para identificar problemas recurrentes');
  }
  
  const failedSuites = results.filter(r => !r.success);
  if (failedSuites.some(s => s.suite === 'Autenticación')) {
    recommendations.push('Problemas de autenticación pueden afectar otros tests');
  }
  
  if (failedSuites.some(s => s.suite === 'Rendimiento')) {
    recommendations.push('Considerar optimizaciones de rendimiento');
  }
  
  return recommendations;
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    headless: !args.includes('--headed'),
    browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'chromium',
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1]
  };
  
  try {
    logHeader('HOSTREAMLY - SISTEMA DE TESTING AUTOMATIZADO');
    
    await checkPrerequisites();
    
    if (options.suite) {
      // Ejecutar suite específica
      const suites = getTestSuites();
      const suite = suites.find(s => s.name.toLowerCase().includes(options.suite.toLowerCase()));
      
      if (suite) {
        const success = await runTestSuite(suite, options);
        log(success ? '🎉 Suite completada exitosamente' : '💥 Suite falló', success ? 'green' : 'red');
      } else {
        logError(`Suite no encontrada: ${options.suite}`);
        log('Suites disponibles:', 'cyan');
        suites.forEach(s => log(`  • ${s.name}`, 'cyan'));
        process.exit(1);
      }
    } else {
      // Ejecutar todas las suites
      const results = await runAllTests(options);
      await generateFinalReport(results);
      
      // Generar reporte HTML final
      try {
        await runCommand('npx', ['playwright', 'show-report']);
      } catch (error) {
        logWarning('No se pudo abrir el reporte HTML automáticamente');
        log('Ejecuta "npx playwright show-report" para ver el reporte', 'cyan');
      }
    }
    
    logSuccess('🎉 Proceso de testing completado');
    
  } catch (error) {
    logError(`Error durante la ejecución: ${error.message}`);
    process.exit(1);
  }
}

// Mostrar ayuda si se solicita
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🎬 Hostreamly Test Runner

Uso:
  node scripts/run-tests.js [opciones]

Opciones:
  --headed              Ejecutar tests con interfaz gráfica
  --browser=<browser>   Especificar navegador (chromium, firefox, webkit)
  --suite=<name>        Ejecutar solo una suite específica
  --help, -h            Mostrar esta ayuda

Ejemplos:
  node scripts/run-tests.js
  node scripts/run-tests.js --headed
  node scripts/run-tests.js --suite=auth
  node scripts/run-tests.js --browser=firefox --headed

Suites disponibles:
`);
  
  getTestSuites().forEach(suite => {
    console.log(`  • ${suite.name}: ${suite.description}`);
  });
  
  process.exit(0);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  runAllTests,
  generateFinalReport,
  getTestSuites
};