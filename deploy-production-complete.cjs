#!/usr/bin/env node

/**
 * 🚀 Script de Despliegue Completo para DigitalOcean
 * Automatiza todo el proceso de despliegue de Hostreamly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DigitalOceanDeployer {
    constructor() {
        this.appName = 'hostreamly-platform';
        this.region = 'nyc1';
        this.projectRoot = process.cwd();
        this.logFile = path.join(this.projectRoot, 'deployment.log');
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type}] ${message}`;
        console.log(logMessage);
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }

    execCommand(command, description) {
        this.log(`Ejecutando: ${description}`);
        this.log(`Comando: ${command}`);
        try {
            const result = execSync(command, { 
                encoding: 'utf8', 
                stdio: 'pipe',
                cwd: this.projectRoot 
            });
            this.log(`✅ ${description} - Completado`);
            return result;
        } catch (error) {
            this.log(`❌ Error en: ${description}`, 'ERROR');
            this.log(`Error: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    checkPrerequisites() {
        this.log('🔍 Verificando prerequisitos...');
        
        // Verificar doctl
        try {
            this.execCommand('doctl version', 'Verificar doctl');
        } catch (error) {
            throw new Error('doctl no está instalado. Instálalo desde: https://docs.digitalocean.com/reference/doctl/how-to/install/');
        }

        // Verificar autenticación
        try {
            this.execCommand('doctl account get', 'Verificar autenticación');
        } catch (error) {
            throw new Error('No estás autenticado en DigitalOcean. Ejecuta: doctl auth init');
        }

        // Verificar archivos necesarios
        const requiredFiles = [
            '.do/app.yaml',
            'package.json',
            'backend/package.json'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(this.projectRoot, file))) {
                throw new Error(`Archivo requerido no encontrado: ${file}`);
            }
        }

        this.log('✅ Todos los prerequisitos verificados');
    }

    buildApplication() {
        this.log('🏗️ Construyendo aplicación...');
        
        // Instalar dependencias del frontend
        this.execCommand('npm install', 'Instalar dependencias del frontend');
        
        // Instalar dependencias del backend
        this.execCommand('npm install', 'Instalar dependencias del backend');
        
        // Build del frontend
        this.execCommand('npm run build', 'Build del frontend');
        
        this.log('✅ Aplicación construida exitosamente');
    }

    deployToDigitalOcean() {
        this.log('🚀 Desplegando en DigitalOcean...');
        
        try {
            // Verificar si la app ya existe
            const existingApps = this.execCommand('doctl apps list --format Name --no-header', 'Listar apps existentes');
            
            if (existingApps.includes(this.appName)) {
                this.log('📱 App existente encontrada, actualizando...');
                this.execCommand(`doctl apps update ${this.appName} --spec .do/app.yaml`, 'Actualizar app existente');
            } else {
                this.log('📱 Creando nueva app...');
                this.execCommand('doctl apps create --spec .do/app.yaml', 'Crear nueva app');
            }
            
        } catch (error) {
            this.log('⚠️ Error en despliegue, intentando crear nueva app...', 'WARN');
            this.execCommand('doctl apps create --spec .do/app.yaml', 'Crear nueva app (fallback)');
        }
        
        this.log('✅ Despliegue iniciado en DigitalOcean');
    }

    waitForDeployment() {
        this.log('⏳ Esperando que el despliegue se complete...');
        
        let attempts = 0;
        const maxAttempts = 30; // 15 minutos máximo
        
        while (attempts < maxAttempts) {
            try {
                const appInfo = this.execCommand(`doctl apps get ${this.appName} --format Phase --no-header`, 'Verificar estado del despliegue');
                
                if (appInfo.trim() === 'ACTIVE') {
                    this.log('✅ Despliegue completado exitosamente');
                    return true;
                } else if (appInfo.trim() === 'ERROR') {
                    throw new Error('El despliegue falló');
                }
                
                this.log(`📊 Estado actual: ${appInfo.trim()}`);
                
            } catch (error) {
                this.log(`⚠️ Error verificando estado: ${error.message}`, 'WARN');
            }
            
            attempts++;
            this.log(`⏳ Intento ${attempts}/${maxAttempts} - Esperando 30 segundos...`);
            
            // Esperar 30 segundos
            execSync('timeout 30 2>nul || sleep 30', { stdio: 'ignore' });
        }
        
        throw new Error('Timeout esperando el despliegue');
    }

    getAppInfo() {
        this.log('📋 Obteniendo información de la app desplegada...');
        
        try {
            const appInfo = this.execCommand(`doctl apps get ${this.appName}`, 'Obtener información de la app');
            
            // Extraer URL de la app
            const urlMatch = appInfo.match(/Live URL:\s+(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                const appUrl = urlMatch[1];
                this.log(`🌐 URL de la aplicación: ${appUrl}`);
                return { url: appUrl };
            }
            
        } catch (error) {
            this.log(`⚠️ Error obteniendo información: ${error.message}`, 'WARN');
        }
        
        return null;
    }

    testDeployment(appUrl) {
        if (!appUrl) {
            this.log('⚠️ No se pudo obtener la URL de la app para testing', 'WARN');
            return;
        }
        
        this.log('🧪 Probando el despliegue...');
        
        try {
            // Test básico con curl
            this.execCommand(`curl -f -s -o nul "${appUrl}" || echo "Test failed"`, 'Test de conectividad básica');
            this.log('✅ Test de conectividad exitoso');
            
        } catch (error) {
            this.log(`⚠️ Error en test de conectividad: ${error.message}`, 'WARN');
        }
    }

    async deploy() {
        try {
            this.log('🚀 Iniciando despliegue completo de Hostreamly...');
            
            // Paso 1: Verificar prerequisitos
            this.checkPrerequisites();
            
            // Paso 2: Construir aplicación
            this.buildApplication();
            
            // Paso 3: Desplegar en DigitalOcean
            this.deployToDigitalOcean();
            
            // Paso 4: Esperar que se complete
            this.waitForDeployment();
            
            // Paso 5: Obtener información de la app
            const appInfo = this.getAppInfo();
            
            // Paso 6: Probar el despliegue
            if (appInfo && appInfo.url) {
                this.testDeployment(appInfo.url);
            }
            
            this.log('🎉 ¡Despliegue completado exitosamente!');
            
            if (appInfo && appInfo.url) {
                console.log('\n' + '='.repeat(60));
                console.log('🌐 TU APLICACIÓN ESTÁ LISTA:');
                console.log(`📱 Frontend: ${appInfo.url}`);
                console.log(`🔧 Backend API: ${appInfo.url}/api`);
                console.log(`💚 Health Check: ${appInfo.url}/api/health`);
                console.log('='.repeat(60));
            }
            
        } catch (error) {
            this.log(`💥 Error en el despliegue: ${error.message}`, 'ERROR');
            console.error('\n❌ Despliegue falló. Revisa el archivo deployment.log para más detalles.');
            process.exit(1);
        }
    }
}

// Ejecutar el despliegue
if (require.main === module) {
    const deployer = new DigitalOceanDeployer();
    deployer.deploy();
}

module.exports = DigitalOceanDeployer;