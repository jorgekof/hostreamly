# 🚀 Instrucciones Completas para Desplegar Hostreamly en DigitalOcean

## 📋 Resumen del Plan de Despliegue

**Servicio Recomendado: DigitalOcean App Platform**
- ✅ Más fácil de configurar y mantener
- ✅ Escalado automático
- ✅ SSL/HTTPS automático
- ✅ Integración directa con GitHub
- ✅ Costo estimado: $76-121/mes para 100 usuarios

## 🔑 PASO 1: Obtener Credenciales de Bunny.net

### 1.1 Accede a tu panel de Bunny.net:
1. Ve a https://panel.bunny.net/
2. Inicia sesión con tu cuenta

### 1.2 Obtén las credenciales de Stream:
1. Ve a **Stream** → **Libraries**
2. Selecciona tu biblioteca o crea una nueva
3. Anota estos valores:
   - **Library ID**: (ejemplo: 12345)
   - **API Key**: Ve a Account → API Keys

### 1.3 Obtén las credenciales de CDN:
1. Ve a **CDN** → **Pull Zones**
2. Selecciona tu Pull Zone o crea una nueva
3. Anota:
   - **Pull Zone Name**: (ejemplo: hostreamly-cdn)
   - **CDN Hostname**: (ejemplo: hostreamly.b-cdn.net)

### 1.4 Obtén las credenciales de Storage:
1. Ve a **Storage** → **Storage Zones**
2. Selecciona tu Storage Zone o crea una nueva
3. Anota:
   - **Storage Zone Name**: (ejemplo: hostreamly-storage)
   - **Storage Password**: (se genera automáticamente)

## 🗄️ PASO 2: Obtener Credenciales de DigitalOcean

### 2.1 Crear DigitalOcean Spaces:
1. Ve a https://cloud.digitalocean.com/
2. Ve a **Spaces** → **Create Space**
3. Configura:
   - **Name**: hostreamly-storage
   - **Region**: New York 3 (nyc3)
   - **CDN**: Habilitado
4. Anota el nombre del Space creado

### 2.2 Crear API Keys para Spaces:
1. Ve a **API** → **Spaces access keys**
2. Haz clic en **Generate New Key**
3. Nombre: hostreamly-spaces-key
4. **GUARDA ESTAS CREDENCIALES** (solo se muestran una vez):
   - **Access Key ID**: (ejemplo: DO00ABC123DEF456GHI7)
   - **Secret Access Key**: (ejemplo: xyz789abc123def456ghi789jkl012mno345pqr678)

### 2.3 Crear Base de Datos PostgreSQL:
1. Ve a **Databases** → **Create Database**
2. Configura:
   - **Engine**: PostgreSQL 15
   - **Plan**: Basic ($15/mes)
   - **Name**: hostreamly-db
   - **Region**: New York 3 (nyc3)
3. Espera a que se cree (5-10 minutos)
4. Anota la **Connection String** completa

## ⚙️ PASO 3: Configurar Credenciales en el Proyecto

### 3.1 Actualiza el archivo .env principal:
```env
# Reemplaza estos valores con tus credenciales reales:
VITE_BUNNY_STREAM_API_KEY="TU_BUNNY_API_KEY_AQUI"
VITE_BUNNY_STREAM_LIBRARY_ID="TU_LIBRARY_ID_AQUI"
VITE_BUNNY_CDN_HOSTNAME="TU_CDN_HOSTNAME_AQUI"
VITE_BUNNY_PULL_ZONE="TU_PULL_ZONE_AQUI"
VITE_BUNNY_STORAGE_ZONE="TU_STORAGE_ZONE_AQUI"
VITE_BUNNY_STORAGE_PASSWORD="TU_STORAGE_PASSWORD_AQUI"
```

### 3.2 Actualiza el archivo backend/.env:
```env
# DigitalOcean Spaces
DO_SPACES_KEY=TU_ACCESS_KEY_AQUI
DO_SPACES_SECRET=TU_SECRET_KEY_AQUI
DO_SPACES_BUCKET=TU_BUCKET_NAME_AQUI

# Bunny.net Backend
BUNNY_API_KEY=TU_BUNNY_API_KEY_AQUI
BUNNY_STREAM_LIBRARY_ID=TU_LIBRARY_ID_AQUI
BUNNY_STORAGE_ZONE=TU_STORAGE_ZONE_AQUI
BUNNY_STORAGE_PASSWORD=TU_STORAGE_PASSWORD_AQUI
BUNNY_PULL_ZONE=TU_PULL_ZONE_AQUI
BUNNY_CDN_HOSTNAME=TU_CDN_HOSTNAME_AQUI
```

## 📂 PASO 4: Configurar Repositorio Git

### 4.1 Instalar Git (si no está instalado):
1. Descarga desde: https://git-scm.com/download/win
2. Instala con configuración por defecto

### 4.2 Crear repositorio en GitHub:
1. Ve a https://github.com/
2. Haz clic en **New repository**
3. Nombre: hostreamly
4. Marca como **Private**
5. Haz clic en **Create repository**

### 4.3 Subir código a GitHub:
```bash
# Ejecuta estos comandos en PowerShell desde la carpeta del proyecto:
git init
git add .
git commit -m "Initial commit - Hostreamly project"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/hostreamly.git
git push -u origin main
```

## 🚀 PASO 5: Desplegar en DigitalOcean App Platform

### 5.1 Crear la aplicación:
```bash
# Ejecuta este comando:
doctl apps create .do/app.yaml
```

### 5.2 Configurar variables de entorno en App Platform:
1. Ve a https://cloud.digitalocean.com/apps
2. Selecciona tu aplicación
3. Ve a **Settings** → **Environment Variables**
4. Agrega todas las variables de entorno:

**Para el Backend:**
```
NODE_ENV=production
PORT=8080
JWT_SECRET=tu_jwt_secret_seguro_aqui
DATABASE_URL=postgresql://usuario:password@host:port/database
DO_SPACES_KEY=tu_access_key
DO_SPACES_SECRET=tu_secret_key
DO_SPACES_BUCKET=tu_bucket_name
BUNNY_API_KEY=tu_bunny_api_key
BUNNY_STREAM_LIBRARY_ID=tu_library_id
```

**Para el Frontend:**
```
VITE_API_BASE_URL=https://tu-app-backend.ondigitalocean.app
VITE_BUNNY_STREAM_API_KEY=tu_bunny_api_key
VITE_BUNNY_STREAM_LIBRARY_ID=tu_library_id
VITE_BUNNY_CDN_HOSTNAME=tu_cdn_hostname
```

## 📊 PASO 6: Verificar el Despliegue

### 6.1 Monitorear el despliegue:
```bash
# Ver el estado de la aplicación:
doctl apps list

# Ver logs de despliegue:
doctl apps logs TU_APP_ID --type=deploy
```

### 6.2 Probar la aplicación:
1. Ve a la URL proporcionada por App Platform
2. Verifica que el frontend carga correctamente
3. Prueba la funcionalidad de subida de videos
4. Verifica que los videos se reproducen correctamente

## 💰 Costos Estimados Mensuales

- **App Platform**: $12-25/mes (Basic plan)
- **PostgreSQL Database**: $15/mes (Basic)
- **DigitalOcean Spaces**: $5/mes (250GB)
- **Load Balancer**: $12/mes (opcional)
- **Bunny.net**: $30-70/mes (según uso)

**Total estimado: $76-121/mes**

## 🔧 Comandos Útiles para Mantenimiento

```bash
# Ver estado de la aplicación
doctl apps list

# Ver logs en tiempo real
doctl apps logs TU_APP_ID --type=run --follow

# Actualizar la aplicación después de cambios
git add .
git commit -m "Update: descripción del cambio"
git push origin main
# App Platform se actualiza automáticamente

# Ver métricas de la aplicación
doctl apps get TU_APP_ID
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs con `doctl apps logs`
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que la base de datos esté accesible
4. Contacta el soporte de DigitalOcean si es necesario

---

**¡Tu aplicación Hostreamly estará lista para producción siguiendo estos pasos!** 🎉