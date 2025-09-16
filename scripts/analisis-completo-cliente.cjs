#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS COMPLETO DE LA WEB HOSTREAMLY');
console.log('👤 Perspectiva: Cliente navegando por primera vez');
console.log('=' .repeat(70));

// Configuración
const BASE_URL = process.env.PRODUCTION_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const isLocal = BASE_URL.includes('localhost');

// Función para hacer requests HTTP/HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const requestOptions = {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...options.headers
            },
            ...options
        };

        const req = client.get(url, requestOptions, (res) => {
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

// Análisis de experiencia de usuario
function analyzeUserExperience(html, url) {
    const issues = [];
    const recommendations = [];
    
    // Verificar elementos críticos de UX
    if (!html.includes('<title>')) {
        issues.push('❌ Falta etiqueta <title>');
    }
    
    if (!html.includes('meta name="description"')) {
        issues.push('❌ Falta meta descripción para SEO');
    }
    
    if (!html.includes('favicon')) {
        issues.push('❌ Falta favicon');
    }
    
    // Verificar accesibilidad básica
    if (!html.includes('alt=')) {
        recommendations.push('💡 Agregar atributos alt a las imágenes');
    }
    
    // Verificar responsive design
    if (!html.includes('viewport')) {
        issues.push('❌ Falta meta viewport para responsive design');
    }
    
    // Verificar carga de recursos
    const cssCount = (html.match(/<link[^>]*rel=["']stylesheet["']/g) || []).length;
    const jsCount = (html.match(/<script[^>]*src=/g) || []).length;
    
    if (cssCount > 5) {
        recommendations.push(`💡 Muchos archivos CSS (${cssCount}), considerar bundling`);
    }
    
    if (jsCount > 10) {
        recommendations.push(`💡 Muchos archivos JS (${jsCount}), considerar bundling`);
    }
    
    return { issues, recommendations };
}

// Páginas principales a analizar
const pagesToAnalyze = [
    { path: '/', name: 'Página Principal', critical: true },
    { path: '/auth', name: 'Autenticación', critical: true },
    { path: '/dashboard', name: 'Dashboard', critical: true },
    { path: '/docs', name: 'Documentación', critical: false },
    { path: '/support', name: 'Soporte', critical: false },
    { path: '/player-demo', name: 'Demo del Reproductor', critical: true },
    { path: '/terms', name: 'Términos y Condiciones', critical: false },
    { path: '/privacy', name: 'Política de Privacidad', critical: false },
    { path: '/checkout', name: 'Checkout/Pago', critical: true },
    { path: '/pricing', name: 'Precios', critical: true },
    { path: '/features', name: 'Características', critical: false },
    { path: '/integrations', name: 'Integraciones', critical: false }
];

// API endpoints a verificar
const apiEndpoints = [
    { path: '/api/health', name: 'Health Check', method: 'GET' },
    { path: '/api/videos', name: 'Videos API', method: 'GET' },
    { path: '/api/users', name: 'Users API', method: 'GET' },
    { path: '/api/auth/status', name: 'Auth Status', method: 'GET' }
];

// Resultados del análisis
const results = {
    pages: [],
    apis: [],
    performance: {},
    ux: {
        issues: [],
        recommendations: []
    },
    security: [],
    accessibility: []
};

async function analyzePage(page) {
    const url = `${BASE_URL}${page.path}`;
    console.log(`\n🔍 Analizando: ${page.name} (${page.path})`);
    
    try {
        const startTime = Date.now();
        const response = await makeRequest(url);
        const loadTime = Date.now() - startTime;
        
        const status = response.statusCode === 200 ? '✅' : 
                      response.statusCode === 404 ? '❌ 404' :
                      response.statusCode >= 300 && response.statusCode < 400 ? '🔄 Redirect' :
                      '❌ Error';
        
        console.log(`   Status: ${status} (${response.statusCode})`);
        console.log(`   Tiempo de carga: ${loadTime}ms`);
        
        // Análisis de UX si la página carga correctamente
        let uxAnalysis = { issues: [], recommendations: [] };
        if (response.statusCode === 200) {
            uxAnalysis = analyzeUserExperience(response.body, url);
            
            // Verificar enlaces internos
            const internalLinks = (response.body.match(/href=["']\/[^"']*["']/g) || []);
            console.log(`   Enlaces internos encontrados: ${internalLinks.length}`);
            
            // Verificar formularios
            const forms = (response.body.match(/<form[^>]*>/g) || []);
            if (forms.length > 0) {
                console.log(`   Formularios encontrados: ${forms.length}`);
            }
            
            // Verificar botones
            const buttons = (response.body.match(/<button[^>]*>|<input[^>]*type=["']button["']/g) || []);
            console.log(`   Botones encontrados: ${buttons.length}`);
        }
        
        results.pages.push({
            ...page,
            url,
            statusCode: response.statusCode,
            loadTime,
            working: response.statusCode === 200,
            ux: uxAnalysis
        });
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.error || error.message}`);
        results.pages.push({
            ...page,
            url,
            statusCode: 0,
            loadTime: 0,
            working: false,
            error: error.error || error.message
        });
    }
}

async function analyzeAPI(endpoint) {
    const url = `${BASE_URL}${endpoint.path}`;
    console.log(`\n🔌 API: ${endpoint.name} (${endpoint.path})`);
    
    try {
        const startTime = Date.now();
        const response = await makeRequest(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const responseTime = Date.now() - startTime;
        
        const status = response.statusCode === 200 ? '✅' : 
                      response.statusCode === 401 ? '🔐 Auth Required' :
                      response.statusCode === 404 ? '❌ Not Found' :
                      '❌ Error';
        
        console.log(`   Status: ${status} (${response.statusCode})`);
        console.log(`   Tiempo de respuesta: ${responseTime}ms`);
        
        // Verificar si es JSON válido
        let isValidJSON = false;
        try {
            JSON.parse(response.body);
            isValidJSON = true;
            console.log('   ✅ Respuesta JSON válida');
        } catch {
            console.log('   ❌ Respuesta no es JSON válido');
        }
        
        results.apis.push({
            ...endpoint,
            url,
            statusCode: response.statusCode,
            responseTime,
            working: response.statusCode === 200 || response.statusCode === 401,
            validJSON: isValidJSON
        });
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.error || error.message}`);
        results.apis.push({
            ...endpoint,
            url,
            statusCode: 0,
            responseTime: 0,
            working: false,
            error: error.error || error.message
        });
    }
}

// Análisis de rendimiento general
function analyzePerformance() {
    console.log('\n⚡ ANÁLISIS DE RENDIMIENTO');
    
    const workingPages = results.pages.filter(p => p.working);
    const avgLoadTime = workingPages.reduce((sum, p) => sum + p.loadTime, 0) / workingPages.length;
    
    console.log(`📊 Páginas funcionando: ${workingPages.length}/${results.pages.length}`);
    console.log(`📊 Tiempo promedio de carga: ${Math.round(avgLoadTime)}ms`);
    
    const slowPages = workingPages.filter(p => p.loadTime > 3000);
    if (slowPages.length > 0) {
        console.log(`⚠️  Páginas lentas (>3s): ${slowPages.map(p => p.name).join(', ')}`);
    }
    
    results.performance = {
        totalPages: results.pages.length,
        workingPages: workingPages.length,
        avgLoadTime: Math.round(avgLoadTime),
        slowPages: slowPages.length
    };
}

// Reporte final desde perspectiva del cliente
function generateClientReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📋 REPORTE DESDE PERSPECTIVA DEL CLIENTE');
    console.log('='.repeat(70));
    
    // Experiencia de navegación
    console.log('\n🧭 EXPERIENCIA DE NAVEGACIÓN:');
    const criticalPages = results.pages.filter(p => p.critical);
    const workingCritical = criticalPages.filter(p => p.working);
    
    console.log(`✅ Páginas críticas funcionando: ${workingCritical.length}/${criticalPages.length}`);
    
    criticalPages.forEach(page => {
        const status = page.working ? '✅' : '❌';
        console.log(`   ${status} ${page.name}: ${page.working ? 'Funciona' : 'No funciona'}`);
    });
    
    // Problemas encontrados
    console.log('\n🚨 PROBLEMAS CRÍTICOS PARA EL CLIENTE:');
    const brokenCritical = criticalPages.filter(p => !p.working);
    if (brokenCritical.length === 0) {
        console.log('✅ No se encontraron problemas críticos');
    } else {
        brokenCritical.forEach(page => {
            console.log(`❌ ${page.name}: ${page.error || 'No carga correctamente'}`);
        });
    }
    
    // Funcionalidades API
    console.log('\n🔌 FUNCIONALIDADES DE LA APLICACIÓN:');
    const workingAPIs = results.apis.filter(api => api.working);
    console.log(`✅ APIs funcionando: ${workingAPIs.length}/${results.apis.length}`);
    
    // Recomendaciones para mejorar experiencia del cliente
    console.log('\n💡 RECOMENDACIONES PARA MEJORAR LA EXPERIENCIA:');
    
    if (results.performance.avgLoadTime > 2000) {
        console.log('🚀 Optimizar velocidad de carga (actualmente >2s)');
    }
    
    if (results.performance.slowPages > 0) {
        console.log('⚡ Optimizar páginas lentas identificadas');
    }
    
    // Recopilar todas las recomendaciones de UX
    const allUXRecommendations = [];
    results.pages.forEach(page => {
        if (page.ux && page.ux.recommendations) {
            allUXRecommendations.push(...page.ux.recommendations);
        }
    });
    
    const uniqueRecommendations = [...new Set(allUXRecommendations)];
    uniqueRecommendations.forEach(rec => console.log(rec));
    
    // Puntuación general
    const totalScore = (
        (workingCritical.length / criticalPages.length) * 40 +
        (workingAPIs.length / results.apis.length) * 30 +
        (results.performance.avgLoadTime < 2000 ? 20 : results.performance.avgLoadTime < 3000 ? 10 : 0) +
        (uniqueRecommendations.length === 0 ? 10 : Math.max(0, 10 - uniqueRecommendations.length))
    );
    
    console.log('\n🎯 PUNTUACIÓN GENERAL DE LA EXPERIENCIA DEL CLIENTE:');
    console.log(`📊 ${Math.round(totalScore)}/100 puntos`);
    
    if (totalScore >= 90) {
        console.log('🌟 Excelente - El cliente tendrá una experiencia excepcional');
    } else if (totalScore >= 75) {
        console.log('👍 Buena - El cliente tendrá una experiencia satisfactoria');
    } else if (totalScore >= 60) {
        console.log('⚠️  Regular - Hay aspectos importantes que mejorar');
    } else {
        console.log('❌ Deficiente - Requiere mejoras urgentes antes del lanzamiento');
    }
    
    console.log('\n' + '='.repeat(70));
}

// Ejecutar análisis completo
async function runCompleteAnalysis() {
    console.log(`🌐 Analizando: ${BASE_URL}`);
    console.log(`📍 Entorno: ${isLocal ? 'Local (desarrollo)' : 'Producción'}`);
    
    // Analizar páginas principales
    console.log('\n📄 ANALIZANDO PÁGINAS PRINCIPALES...');
    for (const page of pagesToAnalyze) {
        await analyzePage(page);
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Analizar APIs
    console.log('\n🔌 ANALIZANDO APIs...');
    for (const endpoint of apiEndpoints) {
        await analyzeAPI(endpoint);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Análisis de rendimiento
    analyzePerformance();
    
    // Generar reporte final
    generateClientReport();
    
    // Guardar resultados en archivo JSON
    const reportPath = path.join(process.cwd(), 'analisis-cliente-completo.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Reporte detallado guardado en: ${reportPath}`);
}

// Ejecutar análisis
runCompleteAnalysis().catch(error => {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
});