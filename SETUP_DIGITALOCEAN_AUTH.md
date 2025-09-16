# 🔐 Configuración de Autenticación DigitalOcean

## Paso 1: Obtener Token de Acceso

1. Ve a [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Haz clic en "Generate New Token"
3. Nombre: `Hostreamly Deploy`
4. Permisos: **Read and Write**
5. Copia el token generado (solo se muestra una vez)

## Paso 2: Configurar doctl

Ejecuta el siguiente comando reemplazando `TU_TOKEN_AQUI` con tu token real:

```bash
doctl.exe auth init --access-token TU_TOKEN_AQUI
```

O de forma interactiva:

```bash
doctl.exe auth init
```

## Paso 3: Verificar Autenticación

```bash
doctl.exe account get
```

## Paso 4: Actualizar Credenciales (Opcional)

Edita el archivo `backend/digitalocean-credentials.js` y reemplaza:
- `YOUR_DIGITALOCEAN_ACCESS_TOKEN_HERE` con tu token real

## Paso 5: Ejecutar Despliegue

```bash
node deploy-simple.js
```

## Comandos Útiles

- Ver aplicaciones: `doctl.exe apps list`
- Ver logs: `doctl.exe apps logs <app-id> --follow`
- Ver cuenta: `doctl.exe account get`
- Cambiar contexto: `doctl.exe auth switch --context <name>`

## Solución de Problemas

### Error: "access token is required"
- Ejecuta: `doctl.exe auth init`
- Verifica: `doctl.exe auth list`

### Error: "Unable to initialize DigitalOcean API client"
- El token puede estar expirado o ser inválido
- Genera un nuevo token y vuelve a autenticarte

### Error: "App already exists"
- El script automáticamente detectará y actualizará la app existente
- O puedes eliminar la app desde el panel de DigitalOcean

---

**¡Una vez configurado, el despliegue será completamente automático!** 🚀