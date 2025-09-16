# 🐳 Despliegue de Hostreamly con Docker

Este documento explica cómo desplegar Hostreamly usando Docker y Docker Compose.

## 📋 Requisitos Previos

### 1. Instalar Docker Desktop

**Para Windows:**
1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/
2. Ejecuta el instalador y sigue las instrucciones
3. Reinicia tu computadora si es necesario
4. Abre Docker Desktop y espera a que se inicie completamente
5. Verifica la instalación ejecutando en PowerShell:
   ```powershell
   docker --version
   docker-compose --version
   ```

### 2. Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edita el archivo `.env` con tus configuraciones:
   ```bash
   # Configuración de Base de Datos
   POSTGRES_DB=hostreamly
   POSTGRES_USER=hostreamly_user
   POSTGRES_PASSWORD=tu_password_seguro_aqui
   
   # Redis
   REDIS_PASSWORD=tu_redis_password_aqui
   
   # JWT y Sesiones
   JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
   SESSION_SECRET=tu_session_secret_aqui
   
   # URLs (ajusta según tu configuración)
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:3001
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   
   # Servicios externos (opcional)
   BUNNY_API_KEY=tu_bunny_api_key
   DO_SPACES_KEY=tu_spaces_key
   ```

## 🚀 Despliegue

### Opción 1: Script Automatizado (Recomendado)

```powershell
# Despliegue completo en modo desarrollo
node deploy-docker.js deploy

# Despliegue en modo producción
node deploy-docker.js deploy --prod

# Ver ayuda
node deploy-docker.js help
```

### Opción 2: Comandos Manuales

#### Desarrollo
```powershell
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

#### Producción
```powershell
# Construir imágenes para producción
docker-compose -f docker-compose.production.yml build

# Iniciar servicios de producción
docker-compose -f docker-compose.production.yml up -d

# Ver estado
docker-compose -f docker-compose.production.yml ps
```

## 🌐 URLs de Acceso

### Modo Desarrollo
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Modo Producción
- **Aplicación completa**: http://localhost (Nginx)
- **API**: http://localhost/api

## 📊 Servicios Incluidos

### Desarrollo (`docker-compose.yml`)
- **PostgreSQL 13**: Base de datos principal
- **Redis 7**: Cache y sesiones
- **Backend**: API Node.js/Express
- **Frontend**: Aplicación React/Vite

### Producción (`docker-compose.production.yml`)
- **PostgreSQL 13**: Base de datos con configuraciones optimizadas
- **Redis 7**: Cache con autenticación
- **Backend**: API optimizada para producción
- **Frontend**: Build estático optimizado
- **Nginx**: Proxy reverso con SSL, compresión y cache

## 🛠️ Comandos Útiles

### Gestión de Contenedores
```powershell
# Ver contenedores activos
docker ps

# Ver todos los contenedores
docker ps -a

# Acceder a un contenedor
docker exec -it hostreamly-backend-dev bash
docker exec -it hostreamly-postgres-dev psql -U hostreamly_user -d hostreamly

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs -f frontend
```

### Gestión de Datos
```powershell
# Backup de la base de datos
docker exec hostreamly-postgres-dev pg_dump -U hostreamly_user hostreamly > backup.sql

# Restaurar base de datos
docker exec -i hostreamly-postgres-dev psql -U hostreamly_user hostreamly < backup.sql

# Ver volúmenes
docker volume ls

# Limpiar volúmenes no utilizados
docker volume prune
```

### Limpieza del Sistema
```powershell
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpieza completa del sistema
docker system prune -a

# Usar el script de limpieza
node deploy-docker.js clean
```

## 🔧 Solución de Problemas

### Docker no está instalado
```
Error: "docker" no se reconoce como un comando
```
**Solución**: Instala Docker Desktop y reinicia la terminal.

### Puerto ya en uso
```
Error: Port 3000 is already in use
```
**Solución**: 
```powershell
# Detener servicios existentes
docker-compose down

# O cambiar puertos en docker-compose.yml
```

### Problemas de permisos
```
Error: Permission denied
```
**Solución**: Ejecuta Docker Desktop como administrador.

### Base de datos no se conecta
```
Error: Connection refused
```
**Solución**:
```powershell
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar servicios
docker-compose restart
```

### Problemas de build
```
Error: Build failed
```
**Solución**:
```powershell
# Limpiar cache de Docker
docker builder prune

# Rebuild sin cache
docker-compose build --no-cache
```

## 📁 Estructura de Archivos Docker

```
Hostreamly/
├── docker-compose.yml              # Configuración de desarrollo
├── docker-compose.production.yml   # Configuración de producción
├── Dockerfile                       # Imagen del frontend
├── backend/Dockerfile              # Imagen del backend
├── nginx.conf                      # Configuración de Nginx
├── deploy-docker.js               # Script de despliegue
├── .env.example                   # Variables de entorno de ejemplo
├── .env                          # Variables de entorno (crear)
└── README-DOCKER.md              # Esta documentación
```

## 🔒 Configuración de Producción

### Variables de Entorno Críticas
Para producción, asegúrate de configurar:

```bash
# Seguridad
JWT_SECRET=clave_jwt_muy_segura_y_larga
SESSION_SECRET=clave_session_muy_segura
REDIS_PASSWORD=password_redis_seguro
POSTGRES_PASSWORD=password_postgres_seguro

# URLs de producción
FRONTEND_URL=https://tu-dominio.com
BACKEND_URL=https://api.tu-dominio.com
ALLOWED_ORIGINS=https://tu-dominio.com
```

### SSL/HTTPS
Para habilitar HTTPS en producción:

1. Coloca tus certificados SSL en la carpeta `ssl/`:
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

2. Descomenta la configuración HTTPS en `nginx.conf`

3. Actualiza las URLs en `.env` para usar `https://`

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica que Docker Desktop esté corriendo
3. Asegúrate de que los puertos no estén en uso
4. Revisa las variables de entorno en `.env`
5. Consulta la documentación oficial de Docker

---

¡Hostreamly está listo para funcionar con Docker! 🎉