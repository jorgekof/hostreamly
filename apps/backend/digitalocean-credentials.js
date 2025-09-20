// Credenciales de DigitalOcean
// IMPORTANTE: Reemplaza estos valores con tus credenciales reales

module.exports = {
  // Token de acceso de DigitalOcean API
  // Obtén tu token desde: https://cloud.digitalocean.com/account/api/tokens
  accessToken: 'YOUR_DIGITALOCEAN_ACCESS_TOKEN_HERE',
  
  // ID de la aplicación (se obtiene después de crear la app por primera vez)
  appId: 'YOUR_APP_ID_HERE',
  
  // Configuración de la región
  region: 'nyc1', // Cambia según tu preferencia
  
  // Configuración de la base de datos
  database: {
    name: 'hostreamly-db',
    engine: 'PG',
    version: '15',
    size: 'db-s-dev-database',
    numNodes: 1
  },
  
  // Configuración de Redis
  redis: {
    name: 'hostreamly-redis',
    engine: 'REDIS',
    version: '7',
    size: 'db-s-dev-database',
    numNodes: 1
  }
};

// INSTRUCCIONES:
// 1. Ve a https://cloud.digitalocean.com/account/api/tokens
// 2. Crea un nuevo token con permisos de lectura y escritura
// 3. Reemplaza 'YOUR_DIGITALOCEAN_ACCESS_TOKEN_HERE' con tu token real
// 4. Guarda este archivo
// 5. Ejecuta: doctl auth init --access-token TU_TOKEN_AQUI