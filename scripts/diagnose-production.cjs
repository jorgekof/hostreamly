#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas de producción en Hostreamly
 * Identifica problemas comunes con enlaces, botones y rutas
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración
const config = {
  productionUrl: process.env.PRODUCTION_URL || 'https://your-domain.com',
  apiEndpoints: [
    '/api/health',
    '/api/videos',
    '/api/users',
    '/health'
  ],
  frontendRoutes: [
    '/',
    '/auth',
    '/dashboard',
    '/docs',
    '/support',
    '/player-demo',
    '/terms',
    '/privacy'
  ]
};

class ProductionDiagnostic {
  constructor() {
    this.results = {
      api: [],
      frontend: [],
      configuration: [],
      recommendations: []
    };
  }

  async diagnose() {
    console.log('🔍 Iniciando diagnóstico de producción...');
    console.log(`📍 URL de producción: ${config.productionUrl}`);
    console.log('=' .repeat(60));

    await this.checkApiEndpoints();
    await this.checkFrontendRoutes();
    await this.checkConfiguration();
    
    this.generateReport();
  }

  async checkApiEndpoints() {
    console.log('\n🔧 Verificando endpoints de API...');
    
    for (const endpoint of config.apiEndpoints) {
      try {
        const result = await this.makeRequest(config.productionUrl + endpoint);
        
        if (result.statusCode === 200) {
          console.log(`✅ ${endpoint} - OK (${result.statusCode})`);
          this.results.api.push({
            endpoint,
            status: 'OK',
            statusCode: result.statusCode,
            responseTime: result.responseTime
          });
        } else {
          console.log(`❌ ${endpoint} - Error (${result.statusCode})`);
          this.results.api.push({
            endpoint,
            status: 'ERROR',
            statusCode: result.statusCode,
            error: result.error
          });
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error de conexión: ${error.message}`);
        this.results.api.push({
          endpoint,
          status: 'CONNECTION_ERROR',
          error: error.message
        });
      }
    }
  }

  async checkFrontendRoutes() {
    console.log('\n🌐 Verificando rutas del frontend...');
    
    for (const route of config.frontendRoutes) {
      try {
        const result = await this.makeRequest(config.productionUrl + route);
        
        if (result.statusCode === 200) {
          // Verificar si la respuesta contiene HTML válido
          const isValidHtml = result.body && result.body.includes('<html');
          
          if (isValidHtml) {
            console.log(`✅ ${route} - OK (HTML válido)`);
            this.results.frontend.push({
              route,
              status: 'OK',
              statusCode: result.statusCode,
              hasValidHtml: true
            });
          } else {
            console.log(`⚠️  ${route} - Respuesta no es HTML válido`);
            this.results.frontend.push({
              route,
              status: 'INVALID_HTML',
              statusCode: result.statusCode,
              hasValidHtml: false
            });
          }
        } else if (result.statusCode === 404) {
          console.log(`❌ ${route} - Ruta no encontrada (404)`);
          this.results.frontend.push({
            route,
            status: 'NOT_FOUND',
            statusCode: 404
          });
          
          this.results.recommendations.push(
            `Configurar fallback para SPA en ${route} - verificar _redirects o .htaccess`
          );
        } else {
          console.log(`❌ ${route} - Error (${result.statusCode})`);
          this.results.frontend.push({
            route,
            status: 'ERROR',
            statusCode: result.statusCode
          });
        }
      } catch (error) {
        console.log(`❌ ${route} - Error de conexión: ${error.message}`);
        this.results.frontend.push({
          route,
          status: 'CONNECTION_ERROR',
          error: error.message
        });
      }
    }
  }

  async checkConfiguration() {
    console.log('\n⚙️  Verificando configuración local...');
    
    // Verificar archivos de configuración
    const configFiles = [
      { path: 'public/_redirects', description: 'Redirects para Netlify/Vercel' },
      { path: 'public/.htaccess', description: 'Configuración Apache' },
      { path: '.do/app.yaml', description: 'Configuración DigitalOcean' },
      { path: 'vite.config.js', description: 'Configuración Vite' },
      { path: 'backend/server.js', description: 'Servidor backend' }
    ];

    for (const file of configFiles) {
      const fullPath = path.join(process.cwd(), file.path);
      
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file.path} - Existe`);
        this.results.configuration.push({
          file: file.path,
          status: 'EXISTS',
          description: file.description
        });
      } else {
        console.log(`❌ ${file.path} - No encontrado`);
        this.results.configuration.push({
          file: file.path,
          status: 'MISSING',
          description: file.description
        });
        
        if (file.path === 'public/_redirects') {
          this.results.recommendations.push(
            'Crear archivo _redirects para manejar rutas SPA'
          );
        }
      }
    }

    // Verificar variables de entorno
    const requiredEnvVars = [
      'VITE_API_BASE_URL',
      'VITE_WEBSOCKET_URL'
    ];

    console.log('\n🔐 Verificando variables de entorno...');
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} - Configurada`);
      } else {
        console.log(`❌ ${envVar} - No configurada`);
        this.results.recommendations.push(
          `Configurar variable de entorno ${envVar}`
        );
      }
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            responseTime
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE DIAGNÓSTICO');
    console.log('='.repeat(60));

    // Resumen de API
    const apiOk = this.results.api.filter(r => r.status === 'OK').length;
    const apiTotal = this.results.api.length;
    console.log(`\n🔧 API Endpoints: ${apiOk}/${apiTotal} funcionando`);
    
    if (apiOk < apiTotal) {
      console.log('❌ Endpoints con problemas:');
      this.results.api
        .filter(r => r.status !== 'OK')
        .forEach(r => console.log(`   - ${r.endpoint}: ${r.status}`));
    }

    // Resumen de Frontend
    const frontendOk = this.results.frontend.filter(r => r.status === 'OK').length;
    const frontendTotal = this.results.frontend.length;
    console.log(`\n🌐 Rutas Frontend: ${frontendOk}/${frontendTotal} funcionando`);
    
    if (frontendOk < frontendTotal) {
      console.log('❌ Rutas con problemas:');
      this.results.frontend
        .filter(r => r.status !== 'OK')
        .forEach(r => console.log(`   - ${r.route}: ${r.status}`));
    }

    // Recomendaciones
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Problemas comunes y soluciones
    console.log('\n🔧 SOLUCIONES COMUNES:');
    console.log('\n1. Enlaces y botones no funcionan (404):');
    console.log('   - Verificar que existe _redirects o .htaccess');
    console.log('   - Configurar catchall_document en DigitalOcean App Platform');
    console.log('   - Verificar que el servidor web maneja rutas SPA correctamente');
    
    console.log('\n2. API no responde:');
    console.log('   - Verificar que el backend esté ejecutándose');
    console.log('   - Revisar configuración de CORS');
    console.log('   - Verificar variables de entorno de producción');
    
    console.log('\n3. Errores de JavaScript:');
    console.log('   - Revisar logs del navegador (F12 -> Console)');
    console.log('   - Verificar que todas las rutas de assets son correctas');
    console.log('   - Comprobar configuración de base path en Vite');

    console.log('\n='.repeat(60));
    console.log('✅ Diagnóstico completado');
    console.log('='.repeat(60));
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  const diagnostic = new ProductionDiagnostic();
  diagnostic.diagnose().catch(console.error);
}

module.exports = ProductionDiagnostic;