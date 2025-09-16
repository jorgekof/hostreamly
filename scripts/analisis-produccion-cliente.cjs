const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuración para producción en DigitalOcean
const PRODUCTION_URL = 'http://154.29.74.169:3000'; // URL de producción según configuración
const PRODUCTION_API_URL = 'http://154.29.74.169:3001/api'; // Backend en puerto 3001

console.log('🌐 ANÁLISIS DE HOSTREAMLY DESDE PERSPECTIVA DEL CLIENTE EN PRODUCCIÓN');
console.log('=' .repeat(80));
console.log(`🎯 URL de Producción: ${PRODUCTION_URL}`);
console.log(`🔌 API de Producción: ${PRODUCTION_API_URL}`);
console.log('=' .repeat(80));

function makeProductionRequest(url, timeout = 10000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            timeout: timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };

        const req = client.request(options, (res) => {
            const loadTime = Date.now() - startTime;
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    success: true,
                    status: res.statusCode,
                    loadTime,
                    contentType: res.headers['content-type'] || 'unknown',
                    contentLength: data.length,
                    data: data.substring(0, 500), // Preview de contenido
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            const loadTime = Date.now() - startTime;
            resolve({
                success: false,
                error: error.message,
                loadTime,
                code: error.code
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            const loadTime = Date.now() - startTime;
            resolve({
                success: false,
                error: 'Request timeout',
                loadTime,
                code: 'TIMEOUT'
            });
        });
        
        req.end();
    });
}

async function analyzeProductionPages() {
    console.log('\n🔍 ANALIZANDO PÁGINAS EN PRODUCCIÓN...');
    
    const pages = [
        { path: '/', name: 'Página Principal', critical: true },
        { path: '/auth', name: 'Autenticación', critical: true },
        { path: '/dashboard', name: 'Dashboard', critical: true },
        { path: '/docs', name: 'Documentación', critical: false },
        { path: '/support', name: 'Soporte', critical: false },
        { path: '/player-demo', name: 'Demo del Reproductor', critical: true },
        { path: '/pricing', name: 'Precios', critical: true },
        { path: '/checkout', name: 'Checkout/Pago', critical: true }
    ];
    
    const results = [];
    
    for (const page of pages) {
        const url = `${PRODUCTION_URL}${page.path}`;
        console.log(`\n🔍 Probando: ${page.name} (${page.path})`);
        console.log(`📍 URL: ${url}`);
        
        const result = await makeProductionRequest(url);
        
        if (result.success) {
            console.log(`✅ Status: ${result.status}`);
            console.log(`⏱️ Tiempo de carga: ${result.loadTime}ms`);
            console.log(`📊 Content-Type: ${result.contentType}`);
            console.log(`📏 Tamaño: ${result.contentLength} bytes`);
            
            // Verificar si es una SPA que devuelve HTML
            if (result.contentType.includes('text/html')) {
                if (result.data.includes('<div id="root">') || result.data.includes('React')) {
                    console.log(`🎯 Detectado: Aplicación React/SPA`);
                } else {
                    console.log(`⚠️ Posible problema: No se detectó estructura SPA`);
                }
            }
        } else {
            console.log(`❌ Error: ${result.error}`);
            console.log(`⏱️ Tiempo transcurrido: ${result.loadTime}ms`);
            console.log(`🔧 Código de error: ${result.code}`);
        }
        
        results.push({
            ...page,
            url,
            ...result
        });
        
        // Pausa entre requests para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

async function analyzeProductionAPIs() {
    console.log('\n🔌 ANALIZANDO APIs EN PRODUCCIÓN...');
    
    const apis = [
        { path: '/health', name: 'Health Check' },
        { path: '/videos', name: 'Videos API' },
        { path: '/users', name: 'Users API' },
        { path: '/auth/status', name: 'Auth Status' }
    ];
    
    const results = [];
    
    for (const api of apis) {
        const url = `${PRODUCTION_API_URL}${api.path}`;
        console.log(`\n🔌 API: ${api.name} (${api.path})`);
        console.log(`📍 URL: ${url}`);
        
        const result = await makeProductionRequest(url);
        
        if (result.success) {
            console.log(`✅ Status: ${result.status}`);
            console.log(`⏱️ Tiempo de respuesta: ${result.loadTime}ms`);
            console.log(`📊 Content-Type: ${result.contentType}`);
            
            // Verificar si es JSON válido
            try {
                if (result.contentType.includes('application/json')) {
                    JSON.parse(result.data);
                    console.log(`✅ JSON válido`);
                    console.log(`📄 Respuesta (preview): ${result.data.substring(0, 200)}`);
                } else {
                    console.log(`⚠️ No es JSON: ${result.contentType}`);
                }
            } catch (e) {
                console.log(`❌ JSON inválido`);
            }
        } else {
            console.log(`❌ Error: ${result.error}`);
            console.log(`🔧 Código: ${result.code}`);
        }
        
        results.push({
            ...api,
            url,
            ...result
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

async function checkNetworkConnectivity() {
    console.log('\n🌐 VERIFICANDO CONECTIVIDAD DE RED...');
    
    // Verificar conectividad básica
    const connectivityTests = [
        { url: 'http://154.29.74.169', name: 'Servidor Base' },
        { url: 'http://154.29.74.169:3000', name: 'Puerto Frontend (3000)' },
        { url: 'http://154.29.74.169:3001', name: 'Puerto Backend (3001)' }
    ];
    
    for (const test of connectivityTests) {
        console.log(`\n🔍 Probando conectividad: ${test.name}`);
        console.log(`📍 URL: ${test.url}`);
        
        const result = await makeProductionRequest(test.url, 5000);
        
        if (result.success) {
            console.log(`✅ Conectividad OK - Status: ${result.status}`);
        } else {
            console.log(`❌ Sin conectividad - Error: ${result.error}`);
        }
    }
}

async function generateProductionReport(pageResults, apiResults) {
    console.log('\n' + '=' .repeat(80));
    console.log('📋 REPORTE DE ANÁLISIS DE PRODUCCIÓN');
    console.log('=' .repeat(80));
    
    // Análisis de páginas
    const workingPages = pageResults.filter(p => p.success && p.status === 200);
    const criticalPages = pageResults.filter(p => p.critical);
    const workingCriticalPages = criticalPages.filter(p => p.success && p.status === 200);
    
    console.log('\n🧭 ANÁLISIS DE PÁGINAS:');
    console.log(`✅ Páginas funcionando: ${workingPages.length}/${pageResults.length}`);
    console.log(`🎯 Páginas críticas funcionando: ${workingCriticalPages.length}/${criticalPages.length}`);
    
    // Análisis de APIs
    const workingAPIs = apiResults.filter(a => a.success && a.status === 200);
    
    console.log('\n🔌 ANÁLISIS DE APIs:');
    console.log(`✅ APIs funcionando: ${workingAPIs.length}/${apiResults.length}`);
    
    // Problemas detectados
    console.log('\n🚨 PROBLEMAS DETECTADOS:');
    const failedPages = pageResults.filter(p => !p.success || p.status !== 200);
    const failedAPIs = apiResults.filter(a => !a.success || a.status !== 200);
    
    if (failedPages.length === 0 && failedAPIs.length === 0) {
        console.log('✅ No se detectaron problemas críticos');
    } else {
        failedPages.forEach(page => {
            console.log(`❌ Página: ${page.name} - ${page.error || `Status ${page.status}`}`);
        });
        failedAPIs.forEach(api => {
            console.log(`❌ API: ${api.name} - ${api.error || `Status ${api.status}`}`);
        });
    }
    
    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    
    if (workingCriticalPages.length < criticalPages.length) {
        console.log('🔧 Revisar configuración de rutas SPA en el servidor web');
        console.log('🔧 Verificar que el archivo .htaccess o _redirects esté configurado');
    }
    
    if (workingAPIs.length < apiResults.length) {
        console.log('🔧 Verificar que el backend esté ejecutándose en producción');
        console.log('🔧 Revisar configuración de puertos y firewall');
        console.log('🔧 Verificar variables de entorno en producción');
    }
    
    // Puntuación general
    const pageScore = (workingPages.length / pageResults.length) * 50;
    const apiScore = (workingAPIs.length / apiResults.length) * 30;
    const criticalScore = (workingCriticalPages.length / criticalPages.length) * 20;
    const totalScore = Math.round(pageScore + apiScore + criticalScore);
    
    console.log('\n🎯 PUNTUACIÓN DE PRODUCCIÓN:');
    console.log(`📊 ${totalScore}/100 puntos`);
    
    if (totalScore >= 90) {
        console.log('🟢 Excelente - La aplicación funciona correctamente en producción');
    } else if (totalScore >= 70) {
        console.log('🟡 Bueno - Algunos aspectos necesitan atención');
    } else if (totalScore >= 50) {
        console.log('🟠 Regular - Problemas importantes que resolver');
    } else {
        console.log('🔴 Crítico - La aplicación no funciona correctamente en producción');
    }
    
    console.log('\n=' .repeat(80));
    
    // Guardar reporte
    const report = {
        timestamp: new Date().toISOString(),
        production_url: PRODUCTION_URL,
        api_url: PRODUCTION_API_URL,
        pages: pageResults,
        apis: apiResults,
        summary: {
            total_score: totalScore,
            working_pages: workingPages.length,
            total_pages: pageResults.length,
            working_apis: workingAPIs.length,
            total_apis: apiResults.length,
            critical_pages_working: workingCriticalPages.length,
            total_critical_pages: criticalPages.length
        }
    };
    
    const fs = require('fs');
    const reportPath = 'analisis-produccion-completo.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Reporte detallado guardado en: ${process.cwd()}\\${reportPath}`);
}

async function main() {
    try {
        // Verificar conectividad básica
        await checkNetworkConnectivity();
        
        // Analizar páginas
        const pageResults = await analyzeProductionPages();
        
        // Analizar APIs
        const apiResults = await analyzeProductionAPIs();
        
        // Generar reporte
        await generateProductionReport(pageResults, apiResults);
        
    } catch (error) {
        console.error('❌ Error durante el análisis:', error.message);
        process.exit(1);
    }
}

// Ejecutar análisis
main();