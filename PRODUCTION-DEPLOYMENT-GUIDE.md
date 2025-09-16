# Guía de Despliegue en Producción - Hostreamly

## Arquitectura de Producción

Esta guía detalla el despliegue completo de Hostreamly en producción utilizando:
- **UltaHost**: Hosting y base de datos MariaDB
- **Bunny.net**: CDN, Stream, Storage, DRM y Shield
- **Agora**: Live streaming y comunicación en tiempo real

## 1. Preparación del Entorno

### 1.1 Requisitos del Servidor (UltaHost)

**Especificaciones Mínimas Recomendadas:**
- **CPU**: 4 vCores (Intel Xeon o AMD EPYC)
- **RAM**: 8GB DDR4
- **Storage**: 100GB SSD NVMe
- **Bandwidth**: 1TB/mes
- **OS**: Ubuntu 22.04 LTS o CentOS 8

**Especificaciones para Alta Carga:**
- **CPU**: 8+ vCores
- **RAM**: 16GB+ DDR4
- **Storage**: 500GB+ SSD NVMe
- **Bandwidth**: 5TB+/mes

### 1.2 Configuración de UltaHost MariaDB

```bash
# Conectar al servidor MariaDB de UltaHost
mysql -h your_ultahost_mariadb_host -u your_username -p

# Crear base de datos
CREATE DATABASE hostreamly_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Crear usuario específico
CREATE USER 'hostreamly_user'@'%' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON hostreamly_prod.* TO 'hostreamly_user'@'%';
FLUSH PRIVILEGES;
```

### 1.3 Configuración del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y

# Instalar certificados SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y

# Instalar Redis para caché y sesiones
sudo apt install redis-server -y

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 2. Configuración de Bunny.net

### 2.1 Configuración de Bunny Stream

1. **Crear Video Library**:
   ```
   - Nombre: hostreamly-videos
   - Región: Automática (Global)
   - Replication Regions: US, EU, APAC
   ```

2. **Configurar DRM**:
   ```
   - Habilitar Widevine DRM
   - Habilitar FairPlay DRM
   - Configurar Media Cage
   - Generar claves de encriptación
   ```

3. **Configurar Webhooks**:
   ```
   Endpoint: https://yourdomain.com/api/webhooks/bunny
   Events: video.uploaded, video.encoded, video.failed
   ```

### 2.2 Configuración de Bunny CDN

```javascript
// Configuración de Pull Zone
{
  "Name": "hostreamly-cdn",
  "OriginUrl": "https://yourdomain.com",
  "Type": 0, // Standard
  "Regions": ["EU", "NA", "AS", "SA", "AF"],
  "CacheControlMaxAge": 31536000,
  "CacheControlPublicMaxAge": 31536000,
  "AddCanonicalHeader": true,
  "EnableGeoZoneUS": true,
  "EnableGeoZoneEU": true,
  "EnableGeoZoneASIA": true,
  "EnableGeoZoneSA": true,
  "EnableGeoZoneAF": true
}
```

### 2.3 Configuración de Bunny Storage

```bash
# Crear Storage Zone
Storage Zone Name: hostreamly-storage
Region: Falkenstein (EU) - Primary
Replication: New York (US), Singapore (AS)
```

### 2.4 Configuración de Bunny Shield

```javascript
// Reglas de WAF
{
  "Rules": [
    {
      "Name": "Block SQL Injection",
      "Enabled": true,
      "ActionType": "Block",
      "TriggerMatchingType": "MatchAny",
      "Triggers": [
        {
          "Type": "Url",
          "PatternMatches": ["*union*select*", "*drop*table*", "*insert*into*"]
        }
      ]
    },
    {
      "Name": "Rate Limiting",
      "Enabled": true,
      "ActionType": "Block",
      "RateLimitRules": [
        {
          "RequestLimit": 100,
          "TimeWindow": 60,
          "BlockTime": 300
        }
      ]
    }
  ]
}
```

## 3. Configuración de Agora

### 3.1 Configuración del Proyecto

1. **Crear Proyecto en Agora Console**:
   ```
   - Project Name: Hostreamly Live
   - Use Case: Social Live
   - Authentication: Secured mode (Token)
   ```

2. **Habilitar Servicios**:
   ```
   - Real-time Communication (RTC)
   - Cloud Recording
   - Real-time Messaging (RTM)
   ```

3. **Configurar Cloud Recording**:
   ```
   Storage Vendor: Amazon S3 (o compatible)
   Bucket: hostreamly-recordings
   Region: us-east-1
   ```

### 3.2 Configuración de Webhooks

```javascript
// Webhook endpoints para Agora
{
  "events": [
    "cloud_recording_started",
    "cloud_recording_uploaded",
    "cloud_recording_failed"
  ],
  "notificationUrl": "https://yourdomain.com/api/webhooks/agora",
  "secret": "your_webhook_secret"
}
```

## 4. Despliegue de la Aplicación

### 4.1 Preparación del Código

```bash
# Clonar repositorio
git clone https://github.com/yourusername/hostreamly.git
cd hostreamly

# Instalar dependencias
npm install --production

# Crear archivo de configuración
cp .env.example .env.production
```

### 4.2 Variables de Entorno de Producción

```env
# .env.production

# Aplicación
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
APP_SECRET=your_super_secure_secret_key_here

# Base de Datos UltaHost
DB_HOST=your_ultahost_mariadb_host
DB_PORT=3306
DB_NAME=hostreamly_prod
DB_USER=hostreamly_user
DB_PASSWORD=your_secure_password
DB_SSL=true
DB_POOL_MAX=20
DB_POOL_MIN=5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Bunny.net Stream
BUNNY_STREAM_API_KEY=your_stream_api_key
BUNNY_STREAM_LIBRARY_ID=your_library_id
BUNNY_STREAM_BASE_URL=https://video.bunnycdn.com

# Bunny.net CDN
BUNNY_CDN_API_KEY=your_cdn_api_key
BUNNY_CDN_PULL_ZONE=hostreamly-cdn
BUNNY_CDN_BASE_URL=https://hostreamly-cdn.b-cdn.net

# Bunny.net Storage
BUNNY_STORAGE_API_KEY=your_storage_api_key
BUNNY_STORAGE_ZONE=hostreamly-storage
BUNNY_STORAGE_BASE_URL=https://storage.bunnycdn.com

# Bunny.net DRM
BUNNY_DRM_CERTIFICATE_ID=your_drm_cert_id
BUNNY_DRM_KEY=your_drm_key
BUNNY_DRM_WIDEVINE_PROVIDER=your_widevine_provider
BUNNY_DRM_FAIRPLAY_CERTIFICATE=your_fairplay_cert

# Bunny.net Shield
BUNNY_SHIELD_API_KEY=your_shield_api_key
BUNNY_SHIELD_ZONE_ID=your_shield_zone_id

# Agora
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
AGORA_CLOUD_RECORDING_REGION=us-east-1

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (SendGrid/SES)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5368709120
ALLOWED_VIDEO_FORMATS=mp4,avi,mov,wmv,flv,webm
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp

# Security
CORS_ORIGIN=https://yourdomain.com
CSRF_SECRET=your_csrf_secret
HELMET_ENABLED=true
```

### 4.3 Inicialización de la Base de Datos

```bash
# Ejecutar migraciones
node scripts/init-database.js

# Verificar conexión
node scripts/test-connections.js
```

### 4.4 Configuración de PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hostreamly-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
```

```bash
# Iniciar aplicación con PM2
pm2 start ecosystem.config.js --env production

# Configurar PM2 para auto-inicio
pm2 startup
pm2 save
```

## 5. Configuración de Nginx

### 5.1 Configuración del Servidor Web

```nginx
# /etc/nginx/sites-available/hostreamly
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;
    
    # Main Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Rate limiting for general requests
        limit_req zone=api burst=20 nodelay;
    }
    
    # API Upload Endpoints
    location /api/videos/upload {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increased timeouts for uploads
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        
        # Rate limiting for uploads
        limit_req zone=upload burst=5 nodelay;
        
        # Increase max body size for video uploads
        client_max_body_size 5G;
    }
    
    # Static Files (if serving locally)
    location /static/ {
        alias /var/www/hostreamly/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/hostreamly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtener certificado SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 6. Configuración de Monitoreo

### 6.1 Configuración de Logs

```bash
# Crear directorio de logs
sudo mkdir -p /var/log/hostreamly
sudo chown $USER:$USER /var/log/hostreamly

# Configurar logrotate
sudo tee /etc/logrotate.d/hostreamly << EOF
/var/log/hostreamly/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload hostreamly-api
    endscript
}
EOF
```

### 6.2 Configuración de Monitoreo con PM2

```bash
# Instalar PM2 Plus para monitoreo
pm2 install pm2-server-monit

# Configurar métricas personalizadas
pm2 set pm2-server-monit:conf {
  "actions": [
    {
      "name": "CPU Usage",
      "value": "process.cpuUsage().user"
    },
    {
      "name": "Memory Usage",
      "value": "process.memoryUsage().heapUsed"
    }
  ]
}
```

### 6.3 Script de Monitoreo de Salud

```bash
#!/bin/bash
# /usr/local/bin/health-check.sh

# Verificar API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $API_STATUS -ne 200 ]; then
    echo "API is down, restarting..."
    pm2 restart hostreamly-api
    # Enviar alerta
    curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
         -d "chat_id=$TELEGRAM_CHAT_ID" \
         -d "text=🚨 Hostreamly API is down and has been restarted"
fi

# Verificar base de datos
DB_STATUS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1" 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Database connection failed"
    curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
         -d "chat_id=$TELEGRAM_CHAT_ID" \
         -d "text=🚨 Hostreamly Database connection failed"
fi

# Verificar Redis
REDIS_STATUS=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_STATUS" != "PONG" ]; then
    echo "Redis is down, restarting..."
    sudo systemctl restart redis-server
fi
```

```bash
# Hacer ejecutable y programar
sudo chmod +x /usr/local/bin/health-check.sh

# Agregar a crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -
```

## 7. Configuración de Backup

### 7.1 Script de Backup Automatizado

```bash
#!/bin/bash
# /usr/local/bin/backup-hostreamly.sh

BACKUP_DIR="/var/backups/hostreamly"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup de archivos de configuración
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /home/$USER/hostreamly/.env.production /etc/nginx/sites-available/hostreamly

# Backup de logs importantes
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz /var/log/hostreamly

# Limpiar backups antiguos
find $BACKUP_DIR -name "*backup*" -mtime +$RETENTION_DAYS -delete

# Subir a Bunny Storage (opcional)
if [ ! -z "$BUNNY_STORAGE_API_KEY" ]; then
    curl -X PUT "https://storage.bunnycdn.com/hostreamly-backups/db_backup_$DATE.sql.gz" \
         -H "AccessKey: $BUNNY_STORAGE_API_KEY" \
         --data-binary @$BACKUP_DIR/db_backup_$DATE.sql.gz
fi

echo "Backup completed: $DATE"
```

```bash
# Programar backup diario
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-hostreamly.sh") | crontab -
```

## 8. Configuración de Seguridad

### 8.1 Configuración de Firewall

```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow from your_office_ip to any port 22
sudo ufw enable

# Configurar fail2ban
sudo apt install fail2ban -y

sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 8.2 Configuración de SSL/TLS

```bash
# Configurar renovación automática de certificados
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet

# Configurar HSTS
sudo tee -a /etc/nginx/snippets/ssl-params.conf << EOF
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_ecdh_curve secp384r1;
ssl_session_timeout 10m;
ssl_session_cache shared:SSL:10m;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
EOF
```

## 9. Optimización de Rendimiento

### 9.1 Configuración de Redis

```bash
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 9.2 Configuración de Node.js

```bash
# Optimizaciones de sistema
echo 'fs.file-max = 65536' | sudo tee -a /etc/sysctl.conf
echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf

# Aplicar cambios
sudo sysctl -p
```

## 10. Verificación del Despliegue

### 10.1 Script de Verificación

```bash
#!/bin/bash
# /usr/local/bin/verify-deployment.sh

echo "🔍 Verificando despliegue de Hostreamly..."

# Verificar API
echo "Verificando API..."
API_RESPONSE=$(curl -s http://localhost:3000/health)
if [[ $API_RESPONSE == *"healthy"* ]]; then
    echo "✅ API funcionando correctamente"
else
    echo "❌ API no responde correctamente"
    exit 1
fi

# Verificar base de datos
echo "Verificando base de datos..."
DB_TEST=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME'" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Base de datos conectada correctamente"
else
    echo "❌ Error conectando a la base de datos"
    exit 1
fi

# Verificar Redis
echo "Verificando Redis..."
REDIS_RESPONSE=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_RESPONSE" = "PONG" ]; then
    echo "✅ Redis funcionando correctamente"
else
    echo "❌ Redis no responde"
    exit 1
fi

# Verificar Nginx
echo "Verificando Nginx..."
NGINX_STATUS=$(sudo systemctl is-active nginx)
if [ "$NGINX_STATUS" = "active" ]; then
    echo "✅ Nginx funcionando correctamente"
else
    echo "❌ Nginx no está activo"
    exit 1
fi

# Verificar SSL
echo "Verificando SSL..."
SSL_CHECK=$(curl -s -I https://yourdomain.com | head -n 1)
if [[ $SSL_CHECK == *"200"* ]]; then
    echo "✅ SSL funcionando correctamente"
else
    echo "❌ Error con SSL"
    exit 1
fi

# Verificar PM2
echo "Verificando PM2..."
PM2_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null)
if [ "$PM2_STATUS" = "online" ]; then
    echo "✅ PM2 funcionando correctamente"
else
    echo "❌ PM2 no está funcionando correctamente"
    exit 1
fi

echo "🎉 Despliegue verificado exitosamente!"
```

### 10.2 Pruebas de Integración

```bash
# Probar upload de video
curl -X POST "https://yourdomain.com/api/videos/upload" \
     -H "Authorization: Bearer $TEST_TOKEN" \
     -F "video=@test-video.mp4" \
     -F "title=Test Video" \
     -F "description=Video de prueba"

# Probar creación de live stream
curl -X POST "https://yourdomain.com/api/livestreams" \
     -H "Authorization: Bearer $TEST_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Stream",
       "description": "Stream de prueba",
       "category": "gaming"
     }'
```

## 11. Mantenimiento y Actualizaciones

### 11.1 Proceso de Actualización

```bash
#!/bin/bash
# /usr/local/bin/update-hostreamly.sh

echo "🔄 Iniciando actualización de Hostreamly..."

# Backup antes de actualizar
/usr/local/bin/backup-hostreamly.sh

# Detener aplicación
pm2 stop hostreamly-api

# Actualizar código
cd /home/$USER/hostreamly
git pull origin main

# Instalar dependencias
npm install --production

# Ejecutar migraciones si es necesario
node scripts/migrate.js

# Reiniciar aplicación
pm2 start hostreamly-api

# Verificar que todo funcione
sleep 10
/usr/local/bin/verify-deployment.sh

echo "✅ Actualización completada"
```

### 11.2 Monitoreo Continuo

```bash
# Script de métricas
#!/bin/bash
# /usr/local/bin/collect-metrics.sh

# CPU y Memoria
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEM_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')

# Espacio en disco
DISK_USAGE=$(df -h / | awk 'NR==2{printf "%s", $5}')

# Conexiones de base de datos
DB_CONNECTIONS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SHOW STATUS LIKE 'Threads_connected'" | tail -1 | awk '{print $2}')

# Enviar métricas a servicio de monitoreo
curl -X POST "https://your-monitoring-service.com/metrics" \
     -H "Content-Type: application/json" \
     -d "{
       \"timestamp\": $(date +%s),
       \"cpu_usage\": $CPU_USAGE,
       \"memory_usage\": $MEM_USAGE,
       \"disk_usage\": \"$DISK_USAGE\",
       \"db_connections\": $DB_CONNECTIONS
     }"
```

Esta guía proporciona una base sólida para el despliegue en producción de Hostreamly. Asegúrate de personalizar las configuraciones según tus necesidades específicas y mantener todas las credenciales seguras.