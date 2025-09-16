#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🔗 ANÁLISIS DE CONECTIVIDAD FRONTEND-BACKEND');
console.log('=' .repeat(60));

// Configuración
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001'; // Puerto corregido
const BACKEND_API_URL = 'http://localhost:3001/api';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Hostreamly-Analysis/1.0',
                'Accept': 'application/json, text/html, */*'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    url: url
                });
            });
        });

        req.on('error', (error) => {
            reject({ error: error.message, url });
        });

        req.on('timeout', () => {
            req.destroy();
            reject({ error: 'Request timeout', url });
        });
    });
}

async function testEndpoint(url, description) {
    console.log(`\n🔍 Probando: ${description}`);
    console.log(`📍 URL: ${url}`);
    
    try {
        const response = await makeRequest(url);
        
        console.log(`✅ Status: ${response.statusCode}`);
        console.log(`📊 Content-Type: ${response.headers['content-type'] || 'No especificado'}`);
        
        // Mostrar primeros caracteres de la respuesta
        const preview = response.body.substring(0, 200).replace(/\n/g, ' ');
        console.log(`📄 Respuesta (preview): ${preview}${response.body.length > 200 ? '...' : ''}`);
        
        return {
            url,
            description,
            success: true,
            statusCode: response.statusCode,
            contentType: response.headers['content-type'],
            bodyLength: response.body.length
        };
        
    } catch (error) {
        console.log(`❌ Error: ${error.error}`);
        return {
            url,
            description,
            success: false,
            error: error.error
        };
    }
}

async function runConnectivityAnalysis() {
    console.log('🚀 Iniciando análisis de conectividad...');
    
    const results = [];
    
    // Probar endpoints principales
    const endpoints = [
        { url: `${FRONTEND_URL}/`, desc: 'Frontend - Página Principal' },
        { url: `${BACKEND_URL}/health`, desc: 'Backend - Health Check' },
        { url: `${BACKEND_API_URL}/health`, desc: 'Backend API - Health Check' },
        { url: `${BACKEND_API_URL}/videos`, desc: 'Backend API - Videos' },
        { url: `${BACKEND_API_URL}/users`, desc: 'Backend API - Users' },
        { url: `${BACKEND_API_URL}/auth/status`, desc: 'Backend API - Auth Status' }
    ];
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint.url, endpoint.desc);
        results.push(result);
        
        // Pausa pequeña entre requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Análisis de resultados
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CONECTIVIDAD');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Endpoints funcionando: ${successful.length}/${results.length}`);
    console.log(`❌ Endpoints con problemas: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\n🟢 FUNCIONANDO:');
        successful.forEach(r => {
            console.log(`   ✅ ${r.description} (${r.statusCode})`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n🔴 CON PROBLEMAS:');
        failed.forEach(r => {
            console.log(`   ❌ ${r.description}: ${r.error}`);
        });
    }
    
    // Diagnóstico específico
    console.log('\n🔧 DIAGNÓSTICO:');
    
    const frontendWorking = results.find(r => r.url.includes('localhost:3000/') && !r.url.includes('/api'))?.success;
    const backendHealthWorking = results.find(r => r.url.includes('/health') && !r.url.includes('/api'))?.success;
    const apiWorking = results.filter(r => r.url.includes('/api') && r.success).length;
    
    if (frontendWorking) {
        console.log('✅ Frontend está funcionando correctamente');
    } else {
        console.log('❌ Frontend tiene problemas');
    }
    
    if (backendHealthWorking) {
        console.log('✅ Backend está respondiendo');
    } else {
        console.log('❌ Backend no está respondiendo');
    }
    
    if (apiWorking > 0) {
        console.log(`✅ ${apiWorking} endpoints de API funcionando`);
    } else {
        console.log('❌ Ningún endpoint de API está funcionando');
    }
    
    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    
    if (!backendHealthWorking) {
        console.log('🔧 Verificar que el backend esté ejecutándose correctamente');
        console.log('🔧 Revisar logs del backend para errores');
    }
    
    if (apiWorking === 0) {
        console.log('🔧 Verificar configuración de rutas en el backend');
        console.log('🔧 Verificar que las rutas API estén correctamente definidas');
        console.log('🔧 Revisar middleware de CORS si hay problemas de origen cruzado');
    }
    
    if (frontendWorking && !backendHealthWorking) {
        console.log('🔧 Posible problema de configuración de puertos');
        console.log('🔧 Verificar que frontend y backend usen puertos diferentes');
    }
    
    // Verificar configuración de puertos
    console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN:');
    console.log('📍 Frontend esperado en: http://localhost:3000');
    console.log('📍 Backend esperado en: http://localhost:3000 (¡CONFLICTO DE PUERTOS!)');
    console.log('⚠️  PROBLEMA DETECTADO: Frontend y Backend en el mismo puerto');
    console.log('💡 SOLUCIÓN: Configurar backend en puerto diferente (ej: 3001)');
    
    console.log('\n' + '='.repeat(60));
    
    return results;
}

// Ejecutar análisis
runConnectivityAnalysis().catch(error => {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
});