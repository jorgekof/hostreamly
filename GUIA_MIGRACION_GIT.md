# Guía de Migración a DigitalOcean App Platform con Git

## ✅ Estado Actual
- ✅ doctl configurado y autenticado
- ✅ Archivos YAML de configuración creados
- ✅ Script de migración preparado
- 🔄 **SIGUIENTE PASO**: Configurar repositorio Git

## 🚀 Pasos para Completar la Migración

### 1. Configurar Repositorio Git

#### Opción A: Crear nuevo repositorio en GitHub/GitLab
1. Ve a GitHub.com o GitLab.com
2. Crea un nuevo repositorio llamado `hostreamly-app`
3. **NO inicialices** con README, .gitignore o licencia

#### Opción B: Usar repositorio existente
Si ya tienes un repositorio, asegúrate de que esté actualizado.

### 2. Inicializar Git en tu proyecto local
```bash
# En el directorio del proyecto
git init
git add .
git commit -m "Initial commit - Hostreamly project"
```

### 3. Conectar con repositorio remoto
```bash
# Reemplaza con tu URL de repositorio
git remote add origin https://github.com/TU_USUARIO/hostreamly-app.git
git branch -M main
git push -u origin main
```

### 4. Actualizar configuración YAML
Edita `.do/app-migration.yaml` y actualiza la sección de GitHub:

```yaml
services:
- name: hostreamly-backend
  source_dir: /backend
  github:
    repo: TU_USUARIO/hostreamly-app  # ← Actualiza esto
    branch: main
    deploy_on_push: true
```

### 5. Ejecutar migración
```bash
node migrate-to-app-platform.js
```

## 📋 Configuraciones Importantes

### Variables de Entorno Requeridas
Asegúrate de tener estas variables en tu `.env`:
- `DATABASE_URL`
- `REDIS_URL` 
- `JWT_SECRET`
- `BUNNY_API_KEY`
- `BUNNY_LIBRARY_ID`

### Estructura del Proyecto
Tu repositorio debe tener esta estructura:
```
/
├── backend/          # Código del backend
├── frontend/         # Código del frontend (opcional)
├── .do/             # Configuraciones de DigitalOcean
└── package.json     # Dependencias del proyecto
```

## 🔧 Comandos Útiles

### Verificar estado de la aplicación
```bash
.\doctl.exe apps list
.\doctl.exe apps get YOUR_APP_ID
```

### Ver logs de despliegue
```bash
.\doctl.exe apps logs YOUR_APP_ID --type=deploy
```

### Actualizar aplicación
```bash
.\doctl.exe apps update YOUR_APP_ID --spec .do/app-migration.yaml
```

## 💡 Consejos

1. **Repositorio Privado**: Si tu código contiene información sensible, usa un repositorio privado
2. **Branch Protection**: Considera proteger la rama `main` para evitar pushes accidentales
3. **Secrets**: Nunca subas archivos `.env` al repositorio
4. **Testing**: Prueba primero con la configuración simple (`app-migration-simple.yaml`)

## 🆘 Solución de Problemas

### Error: "Repository not found"
- Verifica que el repositorio sea público o que DigitalOcean tenga acceso
- Revisa que la URL del repositorio sea correcta

### Error: "Build failed"
- Verifica que `package.json` esté en la raíz o en `/backend`
- Asegúrate de que todas las dependencias estén listadas

### Error: "Health check failed"
- Verifica que tu aplicación responda en el puerto correcto
- Revisa los logs con `doctl apps logs`

## 📞 Próximos Pasos

1. ✅ Configura tu repositorio Git
2. ✅ Actualiza la configuración YAML
3. ✅ Ejecuta la migración
4. ✅ Configura dominios y DNS
5. ✅ Elimina el droplet actual

---

**¿Necesitas ayuda?** Comparte la URL de tu repositorio Git y te ayudo a completar la configuración.