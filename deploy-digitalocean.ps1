# Script de Despliegue Automatizado para DigitalOcean App Platform
# Hostreamly - Plataforma de Video Streaming

Write-Host "🚀 Iniciando despliegue de Hostreamly en DigitalOcean App Platform" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Verificar que doctl esté instalado
if (-not (Get-Command "doctl" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: doctl no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Descarga doctl desde: https://github.com/digitalocean/doctl/releases" -ForegroundColor Yellow
    exit 1
}

# Verificar autenticación
Write-Host "🔐 Verificando autenticación con DigitalOcean..." -ForegroundColor Yellow
$authCheck = doctl auth list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: No estás autenticado con DigitalOcean" -ForegroundColor Red
    Write-Host "Ejecuta: doctl auth init" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Autenticación verificada" -ForegroundColor Green

# Verificar que Git esté configurado
Write-Host "📂 Verificando configuración de Git..." -ForegroundColor Yellow
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Git no está instalado" -ForegroundColor Red
    Write-Host "Descarga Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Verificar si es un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "📦 Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - Hostreamly project"
    git branch -M main
    
    Write-Host "⚠️  IMPORTANTE: Necesitas crear un repositorio en GitHub y ejecutar:" -ForegroundColor Red
    Write-Host "git remote add origin https://github.com/TU_USUARIO/hostreamly.git" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor Yellow
    Write-Host "" 
    Write-Host "Después, actualiza el archivo .do/app.yaml reemplazando 'TU_USUARIO' con tu usuario de GitHub" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter cuando hayas completado estos pasos"
}

# Verificar archivo de configuración
if (-not (Test-Path ".do/app.yaml")) {
    Write-Host "❌ Error: No se encuentra el archivo .do/app.yaml" -ForegroundColor Red
    exit 1
}

# Mostrar checklist de credenciales
Write-Host "📋 CHECKLIST DE CREDENCIALES REQUERIDAS:" -ForegroundColor Cyan
Write-Host "" 
Write-Host "✅ Bunny.net:" -ForegroundColor Green
Write-Host "   - API Key" 
Write-Host "   - Stream Library ID" 
Write-Host "   - CDN Hostname" 
Write-Host "   - Pull Zone" 
Write-Host "   - Storage Zone" 
Write-Host "   - Storage Password" 
Write-Host "" 
Write-Host "✅ DigitalOcean Spaces:" -ForegroundColor Green
Write-Host "   - Access Key ID" 
Write-Host "   - Secret Access Key" 
Write-Host "   - Bucket Name" 
Write-Host "" 
Write-Host "✅ GitHub:" -ForegroundColor Green
Write-Host "   - Repositorio creado y código subido" 
Write-Host "   - Archivo .do/app.yaml actualizado con tu usuario" 
Write-Host "" 

$confirm = Read-Host "¿Has completado todas las configuraciones de credenciales? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "⚠️  Por favor, completa las configuraciones antes de continuar" -ForegroundColor Yellow
    Write-Host "Consulta el archivo INSTRUCCIONES_DESPLIEGUE_COMPLETO.md para más detalles" -ForegroundColor Yellow
    exit 0
}

# Crear la aplicación en DigitalOcean
Write-Host "🚀 Creando aplicación en DigitalOcean App Platform..." -ForegroundColor Yellow
$createResult = doctl apps create .do/app.yaml --format json 2>&1

if ($LASTEXITCODE -eq 0) {
    $appInfo = $createResult | ConvertFrom-Json
    $appId = $appInfo.id
    $appName = $appInfo.spec.name
    
    Write-Host "✅ Aplicación creada exitosamente!" -ForegroundColor Green
    Write-Host "📱 ID de la aplicación: $appId" -ForegroundColor Cyan
    Write-Host "📛 Nombre: $appName" -ForegroundColor Cyan
    Write-Host "" 
    
    Write-Host "🔄 Monitoreando el despliegue..." -ForegroundColor Yellow
    Write-Host "Esto puede tomar varios minutos..." -ForegroundColor Gray
    
    # Monitorear el despliegue
    $deploymentComplete = $false
    $maxAttempts = 30
    $attempts = 0
    
    while (-not $deploymentComplete -and $attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 30
        $attempts++
        
        $appStatus = doctl apps get $appId --format json | ConvertFrom-Json
        $phase = $appStatus.last_deployment_active_at
        
        Write-Host "⏳ Intento $attempts/$maxAttempts - Verificando estado..." -ForegroundColor Gray
        
        if ($appStatus.live_url) {
            $deploymentComplete = $true
            Write-Host "" 
            Write-Host "🎉 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
            Write-Host "================================================" -ForegroundColor Cyan
            Write-Host "🌐 URL de tu aplicación: $($appStatus.live_url)" -ForegroundColor Green
            Write-Host "📊 Panel de control: https://cloud.digitalocean.com/apps/$appId" -ForegroundColor Cyan
            Write-Host "" 
            Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
            Write-Host "1. Visita tu aplicación en: $($appStatus.live_url)" 
            Write-Host "2. Prueba la funcionalidad de subida de videos" 
            Write-Host "3. Verifica que los videos se reproduzcan correctamente" 
            Write-Host "4. Configura tu dominio personalizado (opcional)" 
            Write-Host "" 
            Write-Host "🔧 Comandos útiles:" -ForegroundColor Cyan
            Write-Host "Ver logs: doctl apps logs $appId --type=run --follow" 
            Write-Host "Ver estado: doctl apps get $appId" 
            Write-Host "" 
        }
    }
    
    if (-not $deploymentComplete) {
        Write-Host "⚠️  El despliegue está tomando más tiempo del esperado" -ForegroundColor Yellow
        Write-Host "Puedes monitorear el progreso en: https://cloud.digitalocean.com/apps/$appId" -ForegroundColor Cyan
        Write-Host "O usar: doctl apps logs $appId --type=deploy --follow" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "❌ Error al crear la aplicación:" -ForegroundColor Red
    Write-Host $createResult -ForegroundColor Red
    Write-Host "" 
    Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verifica que el repositorio de GitHub sea accesible" 
    Write-Host "2. Asegúrate de que todas las variables de entorno estén configuradas" 
    Write-Host "3. Revisa el archivo .do/app.yaml" 
    Write-Host "4. Consulta la documentación: INSTRUCCIONES_DESPLIEGUE_COMPLETO.md" 
}

Write-Host "" 
Write-Host "📚 Para más información, consulta:" -ForegroundColor Cyan
Write-Host "- INSTRUCCIONES_DESPLIEGUE_COMPLETO.md" 
Write-Host "- https://docs.digitalocean.com/products/app-platform/" 
Write-Host "" 
Write-Host "¡Gracias por usar Hostreamly! 🎬" -ForegroundColor Green