# 🚀 Guía de Deployment Manual - Hostreamly

## Opción 1: Instalar DigitalOcean CLI (Recomendado)

### Paso 1: Instalar doctl

**Windows (PowerShell como Administrador):**
```powershell
# Usando Chocolatey
choco install doctl

# O usando Scoop
scoop install doctl

# O descargar manualmente desde:
# https://github.com/digitalocean/doctl/releases
```

**Después de instalar:**
```bash
# Autenticar con DigitalOcean
doctl auth init

# Verificar instalación
doctl version
```

### Paso 2: Ejecutar Deployment
```bash
npm run deploy:simple
```

---

## Opción 2: Deployment Manual (Sin CLI)

### Paso 1: Preparar el Código

1. **Build de la aplicación:**
   ```bash
   npm run build
   ```

2. **Verificar archivos:**
   - ✅ `dist/` folder creado
   - ✅ `.do/app.yaml` existe
   - ✅ `backend/.env.production` configurado

### Paso 2: Subir a GitHub

1. **Inicializar repositorio Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   ```

2. **Crear repositorio en GitHub:**
   - Ve a https://github.com/new
   - Crea un repositorio público llamado `hostreamly`
   - No inicialices con README

3. **Subir código:**
   ```bash
   git remote add origin https://github.com/TU_USUARIO/hostreamly.git
   git branch -M main
   git push -u origin main
   ```

### Paso 3: Crear App en DigitalOcean

1. **Ve a DigitalOcean Apps:**
   - https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Conectar Repositorio:**
   - Selecciona "GitHub"
   - Autoriza DigitalOcean
   - Selecciona tu repositorio `hostreamly`
   - Branch: `main`

3. **Configurar Servicios:**

   **Frontend (Static Site):**
   - Name: `frontend`
   - Source Directory: `/`
   - Build Command: `npm run build`
   - Output Directory: `dist`

   **Backend (Web Service):**
   - Name: `backend`
   - Source Directory: `/backend`
   - Build Command: `npm install`
   - Run Command: `npm start`
   - Port: `3000`

### Paso 4: Configurar Variables de Entorno

**En el panel de DigitalOcean Apps > Settings > Environment Variables:**

```env
# Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Base de datos (crear primero en DigitalOcean)
DB_HOST=tu-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=tu-password
DB_NAME=hostreamly
DB_SSL=true

# Redis (crear primero en DigitalOcean)
REDIS_URL=rediss://default:password@host:port

# Seguridad
JWT_SECRET=tu-jwt-secret-muy-seguro
SESSION_SECRET=tu-session-secret-muy-seguro

# DigitalOcean Spaces
DO_SPACES_KEY=tu-spaces-key
DO_SPACES_SECRET=tu-spaces-secret
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=tu-bucket-name
DO_SPACES_REGION=nyc3

# Agora (para streaming)
AGORA_APP_ID=tu-agora-app-id
AGORA_APP_CERTIFICATE=tu-agora-certificate

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Paso 5: Crear Base de Datos

1. **En DigitalOcean:**
   - Ve a "Databases"
   - Crea una base de datos MySQL
   - Anota las credenciales

2. **Configurar tablas:**
   ```bash
   # Localmente, con las credenciales de producción
   npm run setup:db
   ```

### Paso 6: Crear Redis

1. **En DigitalOcean:**
   - Ve a "Databases"
   - Crea una instancia Redis
   - Anota la URL de conexión

### Paso 7: Configurar DigitalOcean Spaces

1. **Crear Space:**
   - Ve a "Spaces"
   - Crea un nuevo Space
   - Habilita CDN

2. **Crear API Keys:**
   - Ve a "API" > "Spaces Keys"
   - Genera nuevas keys
   - Actualiza las variables de entorno

### Paso 8: Deploy

1. **En DigitalOcean Apps:**
   - Click "Deploy"
   - Espera 5-15 minutos

2. **Verificar:**
   - Ve a la URL proporcionada
   - Prueba la funcionalidad
   - Revisa los logs si hay errores

---

## 🔧 Troubleshooting

### Errores Comunes:

1. **Build falla:**
   - Verifica que `npm run build` funcione localmente
   - Revisa las dependencias en `package.json`

2. **Backend no inicia:**
   - Verifica las variables de entorno
   - Revisa los logs en DigitalOcean

3. **Base de datos no conecta:**
   - Verifica las credenciales
   - Asegúrate de que SSL esté habilitado

4. **Archivos no suben:**
   - Verifica las credenciales de Spaces
   - Revisa los permisos del bucket

### Comandos Útiles:

```bash
# Ver logs (si tienes doctl)
doctl apps logs <app-id> --follow

# Listar apps
doctl apps list

# Actualizar app
doctl apps update <app-id> --spec .do/app.yaml
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en DigitalOcean Apps
2. Verifica las variables de entorno
3. Asegúrate de que la base de datos esté configurada
4. Prueba la conectividad a Spaces

¡Tu aplicación Hostreamly estará lista para usar! 🎉