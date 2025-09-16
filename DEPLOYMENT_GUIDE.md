# Guía de Despliegue en DigitalOcean App Platform

## Estado Actual
✅ **Completado:**
- doctl v1.142.0 instalado y configurado
- Autenticación con DigitalOcean configurada
- Scripts de despliegue actualizados
- Frontend construido exitosamente
- Archivo de configuración `.do/app.yaml` creado y corregido

## Próximos Pasos Requeridos

### 1. Configurar Repositorio Git
DigitalOcean App Platform requiere un repositorio Git como fuente:

```bash
# Instalar Git si no está disponible
# Descargar desde: https://git-scm.com/download/win

# Inicializar repositorio
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/hostreamly.git
git push -u origin main
```

### 2. Actualizar Configuración
Editar `.do/app.yaml` y reemplazar la sección del backend:
```yaml
# Reemplazar esto:
image:
  registry_type: DOCR
  repository: hostreamly-backend
  tag: latest

# Con esto:
github:
  repo: tu-usuario/hostreamly
  branch: main
source_dir: /backend
run_command: npm start
environment_slug: node-js
```

Y para el frontend, agregar:
```yaml
github:
  repo: tu-usuario/hostreamly
  branch: main
```

### 3. Conectar GitHub con DigitalOcean
1. Ve a [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Conecta tu cuenta de GitHub
3. Autoriza el acceso al repositorio

### 4. Desplegar
Una vez configurado GitHub:
```bash
node deploy-simple.js
```

## Configuración Actual del Proyecto

### Variables de Entorno Configuradas:
- `NODE_ENV=production`
- `PORT=8080`
- `JWT_SECRET` (requiere configuración)
- `DATABASE_URL` (se configurará automáticamente)
- Configuración de DigitalOcean Spaces
- Configuración de Bunny.net

### Base de Datos:
- PostgreSQL 13 (basic-xs)
- Se conectará automáticamente via `DATABASE_URL`

### Notas Importantes:
- Redis fue removido (requiere plan de producción)
- Las alertas fueron removidas (no soportadas a nivel de app)
- La configuración actual está optimizada para el plan básico

## Comandos Útiles

```bash
# Ver aplicaciones
.\doctl.exe apps list

# Ver logs de la aplicación
.\doctl.exe apps logs <app-id>

# Actualizar aplicación
.\doctl.exe apps update <app-id> --spec .do/app.yaml

# Eliminar aplicación
.\doctl.exe apps delete <app-id>
```

## Solución de Problemas

### Error: "GitHub user not authenticated"
- Conecta GitHub en el panel de DigitalOcean
- Verifica permisos del repositorio

### Error: "parsing app spec"
- Verifica la sintaxis YAML
- Asegúrate de que la indentación sea correcta

### Error: "Command failed"
- Verifica que doctl esté autenticado: `.\doctl.exe auth list`
- Verifica conexión a internet
- Revisa los logs para más detalles

---

**¡El entorno está listo para el despliegue una vez que configures GitHub!**