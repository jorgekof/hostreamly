const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
    origin: ['http://154.29.74.169:3000', 'http://localhost:3000', 'https://154.29.74.169:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Datos de ejemplo en memoria
let users = [
    { id: 1, username: 'admin', email: 'admin@hostreamly.com', created_at: new Date() },
    { id: 2, username: 'demo', email: 'demo@hostreamly.com', created_at: new Date() }
];

let videos = [
    { id: 1, user_id: 1, title: 'Video Demo 1', description: 'Primer video de demostración', views: 150 },
    { id: 2, user_id: 2, title: 'Video Demo 2', description: 'Segundo video de demostración', views: 89 }
];

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'In-Memory',
        server: 'Running',
        users: users.length,
        videos: videos.length
    });
});

// API Routes
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { username, email, password } = req.body;
    const newUser = {
        id: users.length + 1,
        username,
        email,
        created_at: new Date()
    };
    users.push(newUser);
    res.json(newUser);
});

app.get('/api/videos', (req, res) => {
    res.json(videos);
});

app.post('/api/videos', (req, res) => {
    const { title, description, user_id } = req.body;
    const newVideo = {
        id: videos.length + 1,
        user_id: user_id || 1,
        title,
        description,
        views: 0,
        created_at: new Date()
    };
    videos.push(newVideo);
    res.json(newVideo);
});

// Ruta para el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Hostreamly ejecutandose en http://154.29.74.169:${PORT}`);
    console.log(`Health check disponible en http://154.29.74.169:${PORT}/health`);
    console.log(`API disponible en http://154.29.74.169:${PORT}/api`);
    console.log(`Frontend disponible en http://154.29.74.169:${PORT}`);
});

module.exports = app;
