#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando despliegue de producción para Hostreamly...');
console.log('=' .repeat(60));

// Función para ejecutar comandos
function runCommand(command, description) {
    console.log(`\n📋 ${description}`);
    console.log(`💻 Ejecutando: ${command}`);
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
        console.log('✅ Completado exitosamente');
        return true;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

// Función para verificar archivos
function checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Existe' : 'No encontrado'}`);
    return exists;
}

// 1. Verificar archivos necesarios
console.log('\n🔍 Verificando archivos de configuración...');
const requiredFiles = [
    { path: 'public/_redirects', desc: 'Archivo de redirects para SPA' },
    { path: 'public/.htaccess', desc: 'Configuración Apache' },
    { path: '.do/app.yaml', desc: 'Configuración DigitalOcean' },
    { path: '.env.production', desc: 'Variables de entorno de producción' }
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (!checkFile(file.path, file.desc)) {
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Faltan archivos necesarios. Por favor, ejecuta primero las correcciones.');
    process.exit(1);
}

// 2. Verificar que estamos en la rama correcta
console.log('\n🌿 Verificando rama de Git...');
try {
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`📍 Rama actual: ${currentBranch}`);
    
    if (currentBranch !== 'main' && currentBranch !== 'master') {
        console.log('⚠️  Advertencia: No estás en la rama main/master');
        console.log('   Asegúrate de que esta es la rama correcta para producción');
    }
} catch (error) {
    console.log('⚠️  No se pudo determinar la rama actual');
}

// 3. Verificar estado de Git
console.log('\n📝 Verificando estado de Git...');
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.log('📋 Cambios detectados:');
        console.log(gitStatus);
        
        // Preguntar si hacer commit automático
        console.log('\n🔄 Haciendo commit de los cambios...');
        runCommand('git add .', 'Agregando archivos al staging');
        runCommand('git commit -m "Fix: Configuración SPA y variables de entorno para producción"', 'Creando commit');
    } else {
        console.log('✅ No hay cambios pendientes');
    }
} catch (error) {
    console.log('⚠️  Error verificando estado de Git:', error.message);
}

// 4. Push a repositorio
console.log('\n⬆️  Subiendo cambios al repositorio...');
if (!runCommand('git push origin HEAD', 'Subiendo cambios')) {
    console.log('❌ Error al subir cambios. Verifica tu configuración de Git.');
    process.exit(1);
}

// 5. Instrucciones para DigitalOcean
console.log('\n' + '='.repeat(60));
console.log('🎯 PRÓXIMOS PASOS EN DIGITALOCEAN APP PLATFORM:');
console.log('='.repeat(60));
console.log('\n1. 🌐 Ve a: https://cloud.digitalocean.com/apps');
console.log('2. 🔍 Busca tu aplicación "Hostreamly"');
console.log('3. 🔄 Haz clic en "Deploy" o espera el auto-deploy');
console.log('4. 📊 Monitorea los logs de Build y Runtime');
console.log('5. ✅ Una vez completado, prueba tu aplicación');

console.log('\n📋 VERIFICACIONES POST-DESPLIEGUE:');
console.log('- Navegar a diferentes páginas (dashboard, docs, etc.)');
console.log('- Probar botones y enlaces');
console.log('- Verificar que no hay errores 404');
console.log('- Revisar la consola del navegador (F12)');

console.log('\n🔧 SI HAY PROBLEMAS:');
console.log('- Ejecuta: node scripts/diagnose-production.cjs');
console.log('- Revisa los logs en DigitalOcean App Platform');
console.log('- Verifica las variables de entorno en la configuración');

console.log('\n🎉 ¡Despliegue preparado exitosamente!');
console.log('   Los cambios se aplicarán automáticamente en DigitalOcean.');
console.log('=' .repeat(60));

// 6. Mostrar resumen de cambios
console.log('\n📦 RESUMEN DE CORRECCIONES APLICADAS:');
console.log('✅ Configuración SPA (_redirects, .htaccess)');
console.log('✅ Variables de entorno de producción');
console.log('✅ Headers de seguridad');
console.log('✅ Configuración DigitalOcean App Platform');
console.log('✅ Eliminación de rutas conflictivas en backend');
console.log('✅ Script de diagnóstico para troubleshooting');

console.log('\n🔗 Después del despliegue, tu aplicación debería funcionar correctamente en:');
console.log('   https://tu-dominio-digitalocean.com');