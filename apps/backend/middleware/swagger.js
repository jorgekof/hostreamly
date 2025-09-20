const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

// Configuración personalizada de Swagger UI
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #6366f1 }
    .swagger-ui .scheme-container { background: #f8fafc }
  `,
  customSiteTitle: 'Hostreamly Media API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
};

// Middleware para servir la documentación Swagger
const setupSwagger = (app) => {
  // Ruta para la documentación JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Ruta para la interfaz de Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

  // Ruta de redirección para facilitar el acceso
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  console.log('📚 Swagger documentation available at:');
  console.log('   - UI: http://localhost:3001/api-docs');
  console.log('   - JSON: http://localhost:3001/api-docs.json');
};

module.exports = setupSwagger;