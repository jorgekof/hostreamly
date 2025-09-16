# 🚀 Guía de Migración: Droplet → App Platform

## 📋 Resumen de la Migración

Esta guía te ayudará a migrar tu aplicación Hostreamly desde un **Droplet** (servidor virtual) hacia **DigitalOcean App Platform** (PaaS), que es más eficiente, económico y fácil de mantener.

## 🎯 Beneficios de App Platform vs Droplet

| Aspecto | Droplet | App Platform |
|---------|---------|-------------|
| **Mantenimiento** | Manual (actualizaciones, seguridad) | Automático |
| **Escalado** | Manual | Automático |
| **Costo** | ~$10-20/mes + gestión | ~$5-12/mes |
| **SSL/HTTPS** | Configuración manual | Automático |
| **Backups** | Configuración manual | Automático |
| **Monitoreo** | Herramientas externas | Integrado |

## 🛠️ Prerequisitos

### 1. Instalar DigitalOcean CLI (doctl)
```bash
# Windows (usando Chocolatey)
choco install doctl

# O descargar desde: https://github.com/digitalocean/doctl/releases
```

### 2. Configurar doctl
```bash
doctl auth init
# Ingresa tu API token de DigitalOcean
```

### 3. Obtener credenciales necesarias
- **DigitalOcean Spaces**: Access Key, Secret Key, Bucket Name
- **Bunny.net**: API Key, Stream Library ID
- **Otros servicios**: Según tu configuración actual

## 📝 Pasos de Migración

### Paso 1: Configurar Variables de Entorno

Edita el archivo `.do/app-migration.yaml` y reemplaza los siguientes valores:

```yaml
# DigitalOcean Spaces
- key: DO_SPACES_KEY
  type: SECRET
  value: "TU_ACCESS_KEY_AQUI"  # ← Reemplazar
- key: DO_SPACES_SECRET
  type: SECRET
  value: "TU_SECRET_KEY_AQUI"  # ← Reemplazar
- key: DO_SPACES_BUCKET
  value: "TU_BUCKET_NAME_AQUI"  # ← Reemplazar

# Bunny.net
- key: BUNNY_API_KEY
  type: SECRET
  value: "TU_BUNNY_API_KEY_AQUI"  # ← Reemplazar
```

### Paso 2: Ejecutar Script de Migración

```bash
# Desde la raíz del proyecto
node migrate-to-app-platform.js
```

Este script:
- ✅ Verifica prerequisitos
- ✅ Crea la aplicación en App Platform
- ✅ Configura servicios (frontend, backend, base de datos)
- ✅ Monitorea el despliegue
- ✅ Proporciona URLs de acceso

### Paso 3: Verificar el Despliegue

1. **Acceder a la aplicación**:
   - El script te proporcionará las URLs
   - Frontend: `https://tu-app-xxx.ondigitalocean.app`
   - Backend API: `https://tu-app-backend-xxx.ondigitalocean.app`

2. **Verificar funcionalidades**:
   - Registro/Login de usuarios
   - Subida de videos
   - Reproducción de contenido
   - API endpoints

### Paso 4: Migrar Datos (Si es necesario)

#### Desde el Droplet actual:
```bash
# Conectar al droplet
ssh root@159.65.98.112

# Exportar base de datos
pg_dump hostreamly > hostreamly_backup.sql

# Descargar archivos
scp root@159.65.98.112:~/hostreamly_backup.sql ./
```

#### Hacia App Platform:
```bash
# Obtener string de conexión de la nueva DB
doctl apps get <APP_ID> --format Spec.Databases

# Importar datos
psql "postgresql://usuario:password@host:port/db" < hostreamly_backup.sql
```

### Paso 5: Configurar Dominio (Opcional)

1. **En DigitalOcean Panel**:
   - Ve a tu aplicación en App Platform
   - Sección "Settings" → "Domains"
   - Agrega tu dominio personalizado

2. **Actualizar DNS**:
   ```
   A    @     <IP_DE_APP_PLATFORM>
   CNAME www   <URL_DE_APP_PLATFORM>
   ```

## 🔧 Comandos Útiles

### Gestión de la Aplicación
```bash
# Ver estado
doctl apps get <APP_ID>

# Ver logs
doctl apps logs <APP_ID> --type build
doctl apps logs <APP_ID> --type deploy
doctl apps logs <APP_ID> --type run

# Actualizar configuración
doctl apps update <APP_ID> .do/app-migration.yaml

# Listar todas las apps
doctl apps list
```

### Monitoreo
```bash
# Ver métricas
doctl apps get-metrics <APP_ID>

# Ver deployments
doctl apps list-deployments <APP_ID>
```

## 🚨 Solución de Problemas

### Error: "Build failed"
```bash
# Ver logs detallados
doctl apps logs <APP_ID> --type build --follow

# Verificar package.json y dependencias
```

### Error: "Health check failed"
```bash
# Verificar que el endpoint /health responda
curl https://tu-backend-url/health

# Ajustar configuración en app-migration.yaml
```

### Error: "Database connection"
```bash
# Verificar variables de entorno
doctl apps get <APP_ID> --format Spec.Services[0].Envs

# Verificar conectividad a la DB
```

## 💰 Comparación de Costos

### Configuración Actual (Droplet)
- Droplet Basic: $6-12/mes
- Gestión y mantenimiento: ~$50/mes (tiempo)
- **Total estimado: $56-62/mes**

### Nueva Configuración (App Platform)
- App Platform Basic: $5/mes
- Managed Database: $15/mes
- Managed Redis: $15/mes (opcional)
- **Total estimado: $20-35/mes**

**💡 Ahorro estimado: $20-25/mes + tiempo de gestión**

## ✅ Checklist de Migración

- [ ] Prerequisitos instalados (doctl, credenciales)
- [ ] Variables de entorno configuradas
- [ ] Script de migración ejecutado
- [ ] Aplicación desplegada y funcionando
- [ ] Datos migrados (si es necesario)
- [ ] Dominio configurado (opcional)
- [ ] Pruebas de funcionalidad completadas
- [ ] Droplet eliminado (después de confirmar)

## 🆘 Soporte

Si encuentras problemas durante la migración:

1. **Revisa los logs**: `doctl apps logs <APP_ID>`
2. **Verifica la configuración**: `.do/app-migration.yaml`
3. **Consulta la documentación**: [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)

## 🎉 ¡Migración Completada!

Una vez que confirmes que todo funciona correctamente en App Platform:

1. **Actualiza tus bookmarks** con las nuevas URLs
2. **Elimina el droplet** para ahorrar costos
3. **Disfruta** de la gestión automática de tu aplicación

---

**📞 ¿Necesitas ayuda?** La migración está diseñada para ser lo más automática posible, pero si tienes dudas, revisa los logs y la documentación oficial.