#!/usr/bin/env node

/**
 * 🚀 Servidor de Producción para Hostreamly
 * Sirve la aplicación construida con todas las optimizaciones
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

class ProductionServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8080;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Seguridad
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", "https:"],
                },
            },
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }));

        // Compresión
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 1000, // límite de 1000 requests por ventana por IP
            message: 'Demasiadas solicitudes desde esta IP'
        });
        this.app.use(limiter);

        // Logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });
    }

    setupRoutes() {
        // Servir archivos estáticos desde dist
        const distPath = path.join(__dirname, 'dist');
        this.app.use(express.static(distPath, {
            maxAge: '1y', // Cache por 1 año
            etag: true,
            lastModified: true
        }));

        // API Mock para desarrollo/testing
        this.setupMockAPI();

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'production'
            });
        });

        // SPA fallback - serve index.html for all non-API routes
        this.app.get('*', (req, res) => {
            if (!req.path.startsWith('/api/')) {
                res.sendFile(path.join(__dirname, 'dist', 'index.html'));
            } else {
                res.status(404).json({ error: 'API endpoint not found' });
            }
        });
    }

    setupMockAPI() {
        // API básica para testing
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'OK', service: 'Hostreamly API' });
        });

        this.app.get('/api/users', (req, res) => {
            res.json([
                { id: 1, name: 'Usuario Demo', email: 'demo@hostreamly.com' },
                { id: 2, name: 'Admin', email: 'admin@hostreamly.com' }
            ]);
        });

        this.app.get('/api/videos', (req, res) => {
            res.json([
                {
                    id: 1,
                    title: 'Video Demo 1',
                    url: 'https://demo.bunnycdn.com/video1.mp4',
                    thumbnail: 'https://demo.bunnycdn.com/thumb1.jpg'
                },
                {
                    id: 2,
                    title: 'Video Demo 2',
                    url: 'https://demo.bunnycdn.com/video2.mp4',
                    thumbnail: 'https://demo.bunnycdn.com/thumb2.jpg'
                }
            ]);
        });

        this.app.get('/api/auth/status', (req, res) => {
            res.json({
                authenticated: false,
                user: null
            });
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'La ruta solicitada no existe'
            });
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'production' 
                    ? 'Error interno del servidor' 
                    : err.message
            });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log('🚀 Hostreamly Production Server');
            console.log('================================');
            console.log(`🌐 Servidor ejecutándose en puerto ${this.port}`);
            console.log(`🔗 URL local: http://localhost:${this.port}`);
            console.log(`💚 Health check: http://localhost:${this.port}/health`);
            console.log(`🔧 API Health: http://localhost:${this.port}/api/health`);
            console.log('================================');
            
            // Mostrar información del entorno
            console.log('📊 Información del entorno:');
            console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
            console.log(`   PORT: ${this.port}`);
            console.log(`   PID: ${process.pid}`);
            console.log('================================');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
            process.exit(0);
        });

        process.on('SIGINT', () => {
            console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
            process.exit(0);
        });
    }
}

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
    const server = new ProductionServer();
    server.start();
}

module.exports = ProductionServer;