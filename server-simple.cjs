#!/usr/bin/env node

/**
 * 🚀 Servidor Simple para Hostreamly
 * Sirve la aplicación construida de forma básica
 */

const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 8080;

// Middleware básico
app.use(compression());
app.use(express.json());

// Logging simple
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Servir archivos estáticos desde dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API básica
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'Hostreamly API' });
});

// SPA fallback - debe ir al final
app.use((req, res, next) => {
    // Si no es una ruta de API y no se encontró el archivo estático
    if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        next();
    }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log('🚀 Hostreamly Simple Server');
    console.log('============================');
    console.log(`🌐 Servidor ejecutándose en puerto ${port}`);
    console.log(`🔗 URL local: http://localhost:${port}`);
    console.log(`💚 Health check: http://localhost:${port}/health`);
    console.log('============================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});