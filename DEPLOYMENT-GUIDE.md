# 🚀 Guía Completa de Deployment - Hostreamly en UltraHost VPS

## 📋 Requisitos Previos

### En tu VPS de UltraHost:
- Ubuntu 20.04+ o CentOS 8+
- Mínimo 2GB RAM, 20GB almacenamiento
- Acceso root o sudo
- Dominio apuntando a la IP del servidor

### En tu máquina local:
- Acceso SSH al VPS
- Git instalado
- Los archivos de configuración creados

## 🔧 Paso 1: Configurar Conexión SSH

### 1.1 Obtener datos del VPS
Necesitas de UltraHost:
- **IP del servidor**: (ej: 192.168.1.100)
- **Usuario**: (generalmente `root` o `ubuntu`)
- **Contraseña** o **clave SSH**
- **Puerto SSH**: (generalmente 22)

### 1.2 Configurar SSH
Edita el archivo `ssh-config-ultahost.txt` con tus datos reales:

```bash
# Reemplaza estos valores:
Host hostreamly-server
    HostName TU_IP_AQUI          # IP de tu VPS
    User TU_USUARIO_AQUI         # root o ubuntu
    Port 22
    # IdentityFile ~/.ssh/id_rsa # Si usas clave SSH
```

### 1.3 Probar conexión
```bash
ssh hostreamly-server
```

## 🛠️ Paso 2: Preparar el Servidor

### 2.1 Conectarse al VPS
```bash
ssh hostreamly-server
```

### 2.2 Ejecutar script de preparación
```bash
# Subir el script al servidor
scp deploy-ultahost.sh hostreamly-server:/tmp/

# En el servidor, ejecutar:
chmod +x /tmp/deploy-ultahost.sh
sudo /tmp/deploy-ultahost.sh
```

Este script instalará:
- ✅ Node.js 18+
- ✅ PM2
- ✅ Nginx
- ✅ MySQL
- ✅ Git
- ✅ Configuración de firewall

## 📁 Paso 3: Subir el Código

### 3.1 Clonar repositorio (si tienes uno)
```bash
# En el servidor:
cd /var/www
sudo git clone https://github.com/TU_USUARIO/hostreamly.git
sudo chown -R $USER:$USER hostreamly
```

### 3.2 O subir archivos manualmente
```bash
# Desde tu máquina local:
scp -r C:\Users\elbod\Downloads\Hostreamly\Hostreamly/* hostreamly-server:/var/www/hostreamly/
```

### 3.3 Instalar dependencias
```bash
# En el servidor:
cd /var/www/hostreamly
npm install
cd backend && npm install && cd ..
```

## 🗄️ Paso 4: Configurar Base de Datos

### 4.1 Subir script de configuración
```bash
scp setup-env.sh hostreamly-server:/var/www/hostreamly/
scp ecosystem.config.js hostreamly-server:/var/www/hostreamly/
```

### 4.2 Ejecutar configuración de entorno
```bash
# En el servidor:
cd /var/www/hostreamly
chmod +x setup-env.sh
sudo ./setup-env.sh
```

### 4.3 Configurar MySQL
```bash
# En el servidor:
sudo mysql -u root -p < setup-database.sql
```

### 4.4 Editar variables de entorno
```bash
# Editar backend/.env
nano backend/.env

# Cambiar estas variables:
DB_PASSWORD=tu_password_seguro
BUNNY_API_KEY=tu_bunny_api_key
BUNNY_STORAGE_ZONE=tu_storage_zone
BUNNY_PULL_ZONE=tu_pull_zone
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_email

# Editar .env del frontend
nano .env

# Cambiar:
VITE_API_URL=https://tu-dominio.com/api
VITE_BUNNY_PULL_ZONE=https://tu-pull-zone.b-cdn.net
```

## 🌐 Paso 5: Configurar Nginx

### 5.1 Subir configuración de Nginx
```bash
scp nginx-hostreamly.conf hostreamly-server:/tmp/
```

### 5.2 Instalar configuración
```bash
# En el servidor:
sudo cp /tmp/nginx-hostreamly.conf /etc/nginx/sites-available/hostreamly

# Editar con tu dominio
sudo nano /etc/nginx/sites-available/hostreamly
# Reemplazar TU_DOMINIO_AQUI con tu dominio real

# Activar sitio
sudo ln -s /etc/nginx/sites-available/hostreamly /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Paso 6: Configurar SSL (HTTPS)

### 6.1 Subir script SSL
```bash
scp setup-ssl.sh hostreamly-server:/tmp/
```

### 6.2 Ejecutar configuración SSL
```bash
# En el servidor:
chmod +x /tmp/setup-ssl.sh
sudo /tmp/setup-ssl.sh

# Seguir las instrucciones:
# - Ingresar tu dominio
# - Ingresar tu email
```

## 🚀 Paso 7: Construir y Desplegar

### 7.1 Construir la aplicación
```bash
# En el servidor:
cd /var/www/hostreamly
npm run build
```

### 7.2 Configurar PM2
```bash
# Editar ecosystem.config.js con tus valores
nano ecosystem.config.js

# Cambiar:
# - TU_PASSWORD_AQUI
# - TU_JWT_SECRET_AQUI
# - TU_BUNNY_API_KEY_AQUI
# - etc.
```

### 7.3 Iniciar con PM2
```bash
# Iniciar aplicaciones
pm2 start ecosystem.config.js --env production

# Guardar configuración PM2
pm2 save
pm2 startup

# Verificar estado
pm2 status
pm2 logs
```

## ✅ Paso 8: Verificar Deployment

### 8.1 Verificar servicios
```bash
# Verificar Nginx
sudo systemctl status nginx

# Verificar MySQL
sudo systemctl status mysql

# Verificar PM2
pm2 status

# Verificar logs
pm2 logs hostreamly-backend
pm2 logs hostreamly-frontend
```

### 8.2 Probar la aplicación
- Visita: `https://tu-dominio.com`
- Verifica que cargue correctamente
- Prueba registro/login
- Prueba subida de videos

## 🔧 Comandos Útiles de Mantenimiento

### PM2
```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs
pm2 logs hostreamly-backend

# Reiniciar
pm2 restart hostreamly-backend
pm2 restart all

# Parar
pm2 stop hostreamly-backend
pm2 stop all

# Monitorear
pm2 monit
```

### Nginx
```bash
# Probar configuración
sudo nginx -t

# Recargar
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/hostreamly_ssl_access.log
sudo tail -f /var/log/nginx/hostreamly_ssl_error.log
```

### MySQL
```bash
# Conectar
mysql -u hostreamly_user -p hostreamly_prod

# Backup
mysqldump -u hostreamly_user -p hostreamly_prod > backup.sql

# Restaurar
mysql -u hostreamly_user -p hostreamly_prod < backup.sql
```

## 🚨 Solución de Problemas

### Problema: La aplicación no carga
```bash
# Verificar PM2
pm2 status
pm2 logs

# Verificar puertos
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Problema: Error de base de datos
```bash
# Verificar MySQL
sudo systemctl status mysql

# Verificar conexión
mysql -u hostreamly_user -p

# Verificar variables de entorno
cat backend/.env | grep DB_
```

### Problema: SSL no funciona
```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 📞 Información de Contacto y Soporte

### Logs importantes:
- **PM2**: `/var/log/pm2/`
- **Nginx**: `/var/log/nginx/`
- **Aplicación**: `/var/log/hostreamly/`

### Archivos de configuración:
- **Nginx**: `/etc/nginx/sites-available/hostreamly`
- **PM2**: `/var/www/hostreamly/ecosystem.config.js`
- **Env Backend**: `/var/www/hostreamly/backend/.env`
- **Env Frontend**: `/var/www/hostreamly/.env`

---

## 🎉 ¡Felicitaciones!

Si has seguido todos los pasos, tu aplicación Hostreamly debería estar funcionando en:
- **HTTP**: `http://tu-dominio.com` (redirige a HTTPS)
- **HTTPS**: `https://tu-dominio.com`

### Próximos pasos recomendados:
1. 📊 Configurar monitoreo (Grafana, Prometheus)
2. 📧 Configurar alertas por email
3. 🔄 Configurar backups automáticos
4. 🚀 Configurar CI/CD para deployments automáticos
5. 📈 Configurar analytics y métricas

¡Tu plataforma de streaming está lista para producción! 🚀✨