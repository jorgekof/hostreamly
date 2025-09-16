// Configuración PM2 para Hostreamly
// Archivo: ecosystem.config.js

module.exports = {
  apps: [
    {
      // Aplicación Frontend (si se sirve con Node.js)
      name: 'hostreamly-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/hostreamly',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4173
      },
      // Configuración de logs
      log_file: '/var/log/pm2/hostreamly-frontend.log',
      out_file: '/var/log/pm2/hostreamly-frontend-out.log',
      error_file: '/var/log/pm2/hostreamly-frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuración de reinicio
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_memory_restart: '500M',
      
      // Configuración de reinicio automático
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Variables de entorno específicas
      env_production: {
        NODE_ENV: 'production',
        PORT: 4173
      }
    },
    {
      // Aplicación Backend
      name: 'hostreamly-backend',
      script: './backend/server.js',
      cwd: '/var/www/hostreamly',
      instances: 'max', // Usar todos los cores disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Variables de base de datos
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_NAME: 'hostreamly_prod',
        DB_USER: 'hostreamly_user',
        DB_PASSWORD: 'TU_PASSWORD_AQUI',
        
        // Variables de JWT
        JWT_SECRET: 'TU_JWT_SECRET_AQUI',
        JWT_EXPIRES_IN: '7d',
        
        // Variables de Bunny CDN
        BUNNY_API_KEY: 'TU_BUNNY_API_KEY_AQUI',
        BUNNY_STORAGE_ZONE: 'TU_STORAGE_ZONE_AQUI',
        BUNNY_PULL_ZONE: 'TU_PULL_ZONE_AQUI',
        
        // Variables de email (si usas)
        SMTP_HOST: 'TU_SMTP_HOST',
        SMTP_PORT: 587,
        SMTP_USER: 'TU_SMTP_USER',
        SMTP_PASS: 'TU_SMTP_PASS',
        
        // Variables de Redis (si usas)
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: 'TU_REDIS_PASSWORD'
      },
      
      // Configuración de logs
      log_file: '/var/log/pm2/hostreamly-backend.log',
      out_file: '/var/log/pm2/hostreamly-backend-out.log',
      error_file: '/var/log/pm2/hostreamly-backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Configuración de reinicio
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'dist'],
      max_memory_restart: '1G',
      
      // Configuración de reinicio automático
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Variables de entorno específicas
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ],
  
  // Configuración de deployment
  deploy: {
    production: {
      user: 'root',
      host: 'TU_IP_SERVIDOR_AQUI',
      ref: 'origin/main',
      repo: 'https://github.com/TU_USUARIO/hostreamly.git',
      path: '/var/www/hostreamly',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

// COMANDOS ÚTILES PM2:
// 
// Iniciar aplicaciones:
// pm2 start ecosystem.config.js --env production
// 
// Reiniciar aplicaciones:
// pm2 restart ecosystem.config.js
// 
// Parar aplicaciones:
// pm2 stop ecosystem.config.js
// 
// Ver logs:
// pm2 logs
// pm2 logs hostreamly-backend
// pm2 logs hostreamly-frontend
// 
// Monitorear:
// pm2 monit
// 
// Guardar configuración PM2:
// pm2 save
// pm2 startup
// 
// Deployment automático:
// pm2 deploy production setup
// pm2 deploy production

// INSTRUCCIONES:
// 1. Reemplaza todas las variables TU_* con tus valores reales
// 2. Copia este archivo a /var/www/hostreamly/ecosystem.config.js
// 3. Crear directorios de logs: sudo mkdir -p /var/log/pm2
// 4. Iniciar con: pm2 start ecosystem.config.js --env production