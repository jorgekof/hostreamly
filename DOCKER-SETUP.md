# Guía de Instalación y Configuración de Docker para Hostreamly

## 🐳 Instalación de Docker

### Windows

1. **Descargar Docker Desktop**
   - Visita: https://www.docker.com/products/docker-desktop/
   - Descarga Docker Desktop para Windows
   - Ejecuta el instalador como administrador

2. **Requisitos del Sistema**
   - Windows 10/11 (64-bit)
   - WSL 2 habilitado
   - Virtualización habilitada en BIOS
   - Mínimo 4GB RAM (recomendado 8GB+)

3. **Configuración Post-Instalación**
   ```powershell
   # Verificar instalación
   docker --version
   docker compose version
   
   # Verificar que Docker está corriendo
   docker run hello-world
   ```

## 🚀 Uso de Docker con Hostreamly

### Configuración Inicial

1. **Configurar variables de entorno**
   ```powershell
   # El archivo .env ya está configurado desde .env.docker
   # Edita las API keys de Bunny.net:
   notepad .env
   ```

2. **Iniciar servicios de desarrollo**
   ```powershell
   # Usar el script de desarrollo
   .\docker-dev.ps1 setup
   
   # O manualmente:
   docker compose up --build
   ```

### Comandos Principales

```powershell
# Desarrollo
.\docker-dev.ps1 start      # Iniciar servicios
.\docker-dev.ps1 stop       # Detener servicios
.\docker-dev.ps1 logs       # Ver logs
.\docker-dev.ps1 status     # Estado de contenedores

# Testing
.\docker-dev.ps1 test       # Tests automatizados
.\docker-dev.ps1 test-e2e   # Tests end-to-end

# Desarrollo avanzado
.\docker-dev.ps1 shell-be   # Shell del backend
.\docker-dev.ps1 shell-fe   # Shell del frontend
.\docker-dev.ps1 clean      # Limpiar contenedores
```

## 🧪 Testing sin Docker (Alternativa)

Si Docker no está disponible, puedes ejecutar tests localmente:

### Backend Tests
```powershell
cd backend
npm install
npm test
```

### Frontend Tests
```powershell
npm install
npm run test
npm run test:e2e
```

### Tests de Integración
```powershell
# Iniciar backend local
cd backend
npm run dev

# En otra terminal, ejecutar tests frontend
npm run test:integration
```

## 🔧 Solución de Problemas

### Docker no se inicia
1. Verificar que Docker Desktop está ejecutándose
2. Reiniciar Docker Desktop
3. Verificar WSL 2: `wsl --list --verbose`

### Errores de permisos
```powershell
# Ejecutar PowerShell como administrador
# Agregar usuario al grupo docker-users
net localgroup docker-users $env:USERNAME /add
```

### Puertos ocupados
```powershell
# Verificar puertos en uso
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Cambiar puertos en docker-compose.yml si es necesario
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real
```powershell
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

### Acceder a la aplicación
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Base de datos**: localhost:3306

## 🎯 Beneficios del Testing con Docker

✅ **Entorno consistente** - Mismas condiciones en desarrollo y CI/CD
✅ **Aislamiento** - Tests no interfieren con el sistema local
✅ **Paralelización** - Múltiples tests simultáneos
✅ **Limpieza automática** - Estado limpio en cada ejecución
✅ **Cross-platform** - Funciona igual en Windows, Mac y Linux
✅ **Integración completa** - Base de datos, Redis, servicios externos

## 🔄 Flujo de Desarrollo Recomendado

1. **Desarrollo local**: `docker-dev.ps1 start`
2. **Hacer cambios** en el código
3. **Ejecutar tests**: `docker-dev.ps1 test`
4. **Tests E2E**: `docker-dev.ps1 test-e2e`
5. **Commit y push** cuando todos los tests pasen

## 📝 Notas Importantes

- Los contenedores se reconstruyen automáticamente al cambiar código
- Los datos de MySQL y Redis persisten entre reinicios
- Los uploads se almacenan en volúmenes Docker
- Las API keys de Bunny.net deben configurarse en `.env`