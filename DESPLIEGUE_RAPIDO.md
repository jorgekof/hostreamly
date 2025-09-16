# 🚀 Despliegue Rápido de Hostreamly en DigitalOcean

## Paso 1: Completar Credenciales Requeridas

### A. Credenciales de DigitalOcean Spaces (Para almacenamiento de archivos)
1. Ve a tu panel de DigitalOcean: https://cloud.digitalocean.com/spaces
2. Crea un nuevo Space o usa uno existente
3. Ve a "API" > "Spaces Keys" y crea una nueva clave
4. Actualiza `backend/.env`:
   ```
   DO_SPACES_KEY=tu_access_key_aqui
   DO_SPACES_SECRET=tu_secret_key_aqui
   DO_SPACES_BUCKET=nombre_de_tu_bucket
   ```

### B. Credenciales de Bunny.net (Para streaming de video)
1. Regístrate en https://bunny.net
2. Crea una Stream Library
3. Obtén las credenciales y actualiza ambos archivos `.env`:
   ```
   BUNNY_API_KEY=tu_api_key
   BUNNY_STREAM_LIBRARY_ID=tu_library_id
   BUNNY_CDN_HOSTNAME=tu_hostname.b-cdn.net
   ```

## Paso 2: Despliegue Directo (Sin Git)

Como no tienes Git instalado, usaremos el método directo:

```powershell
# 1. Crear la aplicación directamente
.\doctl apps create .do\app.yaml

# 2. Verificar el estado
.\doctl apps list

# 3. Ver logs de despliegue
.\doctl apps logs YOUR_APP_ID --follow
```

## Paso 3: Configurar Variables de Entorno

Después de crear la app, configura las variables:

```powershell
# Obtener ID de la app
.\doctl apps list

# Configurar variables del backend
.\doctl apps update YOUR_APP_ID --spec .do\app.yaml
```

## Paso 4: Verificar Despliegue

1. Ve a tu panel de DigitalOcean Apps
2. Verifica que todos los servicios estén corriendo
3. Accede a tu aplicación usando la URL proporcionada

## Costos Estimados
- **Backend API**: $12/mes (Basic plan)
- **Frontend**: $3/mes (Static site)
- **PostgreSQL**: $15/mes (Basic)
- **DigitalOcean Spaces**: $5/mes (250GB)
- **Bunny.net**: $1-10/mes (según uso)

**Total**: ~$36-45/mes

## Solución de Problemas

### Si el despliegue falla:
1. Verifica que todas las credenciales estén correctas
2. Revisa los logs: `.\doctl apps logs YOUR_APP_ID`
3. Asegúrate de que el dominio esté disponible

### Si necesitas actualizar:
```powershell
.\doctl apps update YOUR_APP_ID --spec .do\app.yaml
```

¡Tu aplicación estará lista en 10-15 minutos! 🎉