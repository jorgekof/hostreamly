#!/usr/bin/env node

/**
 * Script de verificación para producción
 * Verifica que todas las dependencias y configuraciones estén listas para el deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Archivo no encontrado: ${filePath}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  log('\n📦 Verificando package.json...', 'blue');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json no encontrado', 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Verificar dependencias críticas
  const criticalDeps = {
    '@supabase/supabase-js': 'Cliente de Supabase',
    'react': 'React framework',
    'react-dom': 'React DOM',
    'vite': 'Build tool'
  };
  
  let allDepsOk = true;
  
  for (const [dep, description] of Object.entries(criticalDeps)) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      log(`✅ ${description} (${dep})`, 'green');
    } else {
      log(`❌ ${description} (${dep}) - No encontrado`, 'red');
      allDepsOk = false;
    }
  }
  
  // Verificar scripts
  const requiredScripts = ['build', 'dev'];
  for (const script of requiredScripts) {
    if (packageJson.scripts?.[script]) {
      log(`✅ Script '${script}' configurado`, 'green');
    } else {
      log(`❌ Script '${script}' no encontrado`, 'red');
      allDepsOk = false;
    }
  }
  
  return allDepsOk;
}

function checkEnvironmentVariables() {
  log('\n🔧 Verificando configuración de variables de entorno...', 'blue');
  
  const envExamplePath = path.join(process.cwd(), '.env.production.example');
  const envPath = path.join(process.cwd(), '.env');
  
  checkFile(envExamplePath, 'Plantilla de variables de entorno (.env.production.example)');
  
  if (fs.existsSync(envPath)) {
    log('✅ Archivo .env encontrado (desarrollo)', 'green');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PROJECT_ID',
      'VITE_SUPABASE_PUBLISHABLE_KEY'
    ];
    
    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        log(`✅ Variable ${varName} configurada`, 'green');
      } else {
        log(`⚠️  Variable ${varName} no encontrada en .env`, 'yellow');
      }
    }
  } else {
    log('⚠️  Archivo .env no encontrado (normal en producción)', 'yellow');
  }
}

function checkSupabaseConfig() {
  log('\n🗄️  Verificando configuración de Supabase...', 'blue');
  
  const supabaseConfigPath = path.join(process.cwd(), 'supabase', 'config.toml');
  const supabaseClientPath = path.join(process.cwd(), 'src', 'integrations', 'supabase', 'client.ts');
  
  checkFile(supabaseConfigPath, 'Configuración de Supabase (supabase/config.toml)');
  checkFile(supabaseClientPath, 'Cliente de Supabase (src/integrations/supabase/client.ts)');
  
  // Verificar funciones de Supabase
  const functionsPath = path.join(process.cwd(), 'supabase', 'functions');
  if (fs.existsSync(functionsPath)) {
    const functions = fs.readdirSync(functionsPath).filter(item => 
      fs.statSync(path.join(functionsPath, item)).isDirectory()
    );
    
    if (functions.length > 0) {
      log(`✅ ${functions.length} funciones de Supabase encontradas: ${functions.join(', ')}`, 'green');
    } else {
      log('⚠️  No se encontraron funciones de Supabase', 'yellow');
    }
  }
}

function checkBuildConfig() {
  log('\n🏗️  Verificando configuración de build...', 'blue');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  checkFile(viteConfigPath, 'Configuración de Vite');
  checkFile(tailwindConfigPath, 'Configuración de Tailwind CSS');
  checkFile(tsconfigPath, 'Configuración de TypeScript');
}

function checkDeploymentFiles() {
  log('\n🚀 Verificando archivos de deployment...', 'blue');
  
  const deploymentGuidePath = path.join(process.cwd(), 'DEPLOYMENT_GUIDE.md');
  checkFile(deploymentGuidePath, 'Guía de deployment');
  
  // Verificar archivos específicos de hosting
  const hostingFiles = {
    'vercel.json': 'Configuración de Vercel',
    'netlify.toml': 'Configuración de Netlify',
    '_redirects': 'Redirects de Netlify',
    'railway.toml': 'Configuración de Railway'
  };
  
  let hasHostingConfig = false;
  for (const [file, description] of Object.entries(hostingFiles)) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${description}`, 'green');
      hasHostingConfig = true;
    }
  }
  
  if (!hasHostingConfig) {
    log('⚠️  No se encontró configuración específica de hosting', 'yellow');
    log('   Esto es normal si usas auto-detección del hosting', 'yellow');
  }
}

function runProductionBuild() {
  log('\n🔨 Verificando build de producción...', 'blue');
  
  try {
    log('Ejecutando npm run build...', 'blue');
    execSync('npm run build', { stdio: 'pipe' });
    
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      log(`✅ Build exitoso - ${files.length} archivos generados en dist/`, 'green');
      
      // Verificar archivos críticos
      const criticalFiles = ['index.html', 'assets'];
      for (const file of criticalFiles) {
        if (files.includes(file)) {
          log(`✅ Archivo crítico encontrado: ${file}`, 'green');
        } else {
          log(`❌ Archivo crítico faltante: ${file}`, 'red');
        }
      }
      
      return true;
    } else {
      log('❌ Directorio dist/ no encontrado después del build', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error en el build:', 'red');
    log(error.message, 'red');
    return false;
  }
}

function main() {
  log('🔍 VERIFICACIÓN DE PRODUCCIÓN PARA SUPABASE', 'blue');
  log('='.repeat(50), 'blue');
  
  const checks = [
    checkPackageJson(),
    checkEnvironmentVariables(),
    checkSupabaseConfig(),
    checkBuildConfig(),
    checkDeploymentFiles(),
    runProductionBuild()
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  
  log('\n📊 RESUMEN:', 'blue');
  log('='.repeat(30), 'blue');
  
  if (passedChecks === totalChecks) {
    log(`🎉 ¡Todas las verificaciones pasaron! (${passedChecks}/${totalChecks})`, 'green');
    log('✅ Tu proyecto está listo para producción', 'green');
  } else {
    log(`⚠️  ${passedChecks}/${totalChecks} verificaciones pasaron`, 'yellow');
    log('🔧 Revisa los errores arriba antes de hacer deploy', 'yellow');
  }
  
  log('\n📚 Para más información, consulta DEPLOYMENT_GUIDE.md', 'blue');
}

// Ejecutar el script
main();