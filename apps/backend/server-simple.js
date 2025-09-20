const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting simple server...');
console.log('PORT:', PORT);

// CORS configuration
const corsOptions = {
  origin: [
    'http://154.29.74.169:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://154.29.74.169:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Basic middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test data
let users = [
    { id: 1, username: 'admin', email: 'admin@hostreamly.com', created_at: new Date() },
    { id: 2, username: 'demo', email: 'demo@hostreamly.com', created_at: new Date() }
];

let videos = [
    { id: 1, user_id: 1, title: 'Video Demo 1', description: 'Primer video de demostración', views: 150 },
    { id: 2, user_id: 2, title: 'Video Demo 2', description: 'Segundo video de demostración', views: 89 }
];

// Basic API Routes
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/users', (req, res) => {
    res.json(users);
});

app.get('/api/videos', (req, res) => {
    res.json(videos);
});

app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: false, user: null });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor simple ejecutándose en puerto ${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 API Users: http://localhost:${PORT}/api/users`);
    console.log(`🎥 API Videos: http://localhost:${PORT}/api/videos`);
});

module.exports = app;