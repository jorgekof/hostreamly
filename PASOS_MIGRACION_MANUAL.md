# 🚀 Guía Paso a Paso: Migración a DigitalOcean App Platform

## ✅ Estado Actual
- ✅ Configuraciones revisadas
- ✅ Archivos de configuración preparados
- ✅ doctl CLI configurado y autenticado
- ⏳ **Siguiente paso**: Configurar repositorio Git

## 📋 Pasos Restantes para Completar la Migración

### 1. 🔧 Configurar Repositorio Git (REQUERIDO)

App Platform requiere un repositorio Git. Tienes dos opciones:

#### Opción A: GitHub (Recomendado)
```bash
# 1. Crear repositorio en GitHub
# Ve a https://github.com/new y crea un repositorio llamado 'hostreamly'

# 2. Inicializar Git en tu proyecto
git init
git add .
git commit -m "Initial commit - Hostreamly project"

# 3. Conectar con GitHub (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/hostreamly.git
git branch -M main
git push -u origin main
```

#### Opción B: GitLab
```bash
# Similar proceso pero en GitLab
# Ve a https://gitlab.com/projects/new
```

### 2. 🔄 Actualizar Configuración

Una vez que tengas el repositorio, actualiza el archivo de configuración:

```yaml
# Editar: .do/app-migration.yaml
# Cambiar estas líneas:
github:
  repo: TU-USUARIO/hostreamly  # ← Cambiar por tu repositorio real
  branch: main
  deploy_on_push: true
```

### 3. 🚀 Ejecutar Migración

```bash
# Una vez configurado el repositorio Git:
node migrate-to-app-platform.js
```

### 4. 🔧 Configurar Variables de Entorno

Después de crear la app, configura estas variables en el panel de DigitalOcean:

```bash
# Variables requeridas:
DO_SPACES_KEY=tu_access_key_aqui
DO_SPACES_SECRET=tu_secret_key_aqui
DO_SPACES_BUCKET=hostreamly-storage
BUNNY_API_KEY=tu_bunny_api_key_aqui
JWT_SECRET=tu_jwt_secret_super_seguro
```

### 5. 🌐 Verificar Despliegue

```bash
# Verificar estado de la aplicación
.\doctl.exe apps list

# Ver detalles de tu app
.\doctl.exe apps get TU_APP_ID

# Ver logs si hay problemas
.\doctl.exe apps logs TU_APP_ID
```

### 6. 🔄 Migrar DNS (Opcional)

Si tienes un dominio personalizado:
1. Ve al panel de DigitalOcean App Platform
2. Agrega tu dominio en la sección "Settings" > "Domains"
3. Actualiza los registros DNS según las instrucciones

### 7. 🗑️ Eliminar Droplet

**⚠️ SOLO después de verificar que todo funciona:**

```bash
# Listar droplets
.\doctl.exe compute droplet list

# Eliminar droplet (CUIDADO - irreversible)
.\doctl.exe compute droplet delete TU_DROPLET_ID
```

## 🆘 Alternativa Rápida: Solo Backend

Si quieres migrar solo el backend primero:

```bash
# Usar configuración simplificada
.\doctl.exe apps create --spec .do/app-migration-simple.yaml
```

## 📞 Soporte

Si encuentras problemas:
1. Verifica que doctl esté autenticado: `.\doctl.exe auth list`
2. Revisa los logs: `.\doctl.exe apps logs TU_APP_ID`
3. Consulta la documentación: https://docs.digitalocean.com/products/app-platform/

## 💰 Comparación de Costos

| Servicio | Droplet Actual | App Platform |
|----------|----------------|---------------|
| Servidor | $6-12/mes | $5/mes (básico) |
| Base de datos | Manual | $15/mes (managed) |
| Mantenimiento | Alto | Bajo |
| Escalabilidad | Manual | Automática |

**Beneficios de App Platform:**
- ✅ Despliegues automáticos desde Git
- ✅ Escalado automático
- ✅ Base de datos administrada
- ✅ SSL automático
- ✅ Monitoreo integrado
- ✅ Menos mantenimiento manual

---

**📝 Nota**: Esta migración está preparada y lista. Solo necesitas configurar el repositorio Git para proceder.