#!/usr/bin/env pwsh
# Script de Despliegue Simplificado para Hostreamly
# Sin dependencias de Git

Write-Host "🚀 Despliegue Simplificado de Hostreamly" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Verificar doctl
if (!(Test-Path "./doctl.exe")) {
    Write-Host "❌ Error: doctl.exe no encontrado en el directorio actual" -ForegroundColor Red
    Write-Host "Descarga doctl desde: https://github.com/digitalocean/doctl/releases" -ForegroundColor Yellow
    exit 1
}

# Verificar autenticación
Write-Host "🔐 Verificando autenticación..." -ForegroundColor Blue
$authResult = ./doctl auth list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: No estás autenticado en DigitalOcean" -ForegroundColor Red
    Write-Host "Ejecuta: ./doctl auth init" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Autenticación verificada" -ForegroundColor Green

# Mostrar credenciales requeridas
Write-Host "
📋 CREDENCIALES REQUERIDAS:" -ForegroundColor Yellow
Write-Host "1. DigitalOcean Spaces (para almacenamiento):" -ForegroundColor White
Write-Host "   - DO_SPACES_KEY" -ForegroundColor Gray
Write-Host "   - DO_SPACES_SECRET" -ForegroundColor Gray
Write-Host "   - DO_SPACES_BUCKET" -ForegroundColor Gray
Write-Host "
2. Bunny.net (para streaming):" -ForegroundColor White
Write-Host "   - BUNNY_API_KEY" -ForegroundColor Gray
Write-Host "   - BUNNY_STREAM_LIBRARY_ID" -ForegroundColor Gray
Write-Host "   - BUNNY_CDN_HOSTNAME" -ForegroundColor Gray

# Preguntar si quiere continuar
$continue = Read-Host "¿Tienes todas las credenciales configuradas? (s/n)"
if ($continue -ne "s" -and $continue -ne "S") {
    Write-Host "📖 Consulta DESPLIEGUE_RAPIDO.md para obtener las credenciales" -ForegroundColor Yellow
    exit 0
}

# Crear aplicación
Write-Host "
🚀 Creando aplicación en DigitalOcean..." -ForegroundColor Blue
$createResult = ./doctl apps create .do/app-simple.yaml --format json 2>&1

if ($LASTEXITCODE -eq 0) {
    $appInfo = $createResult | ConvertFrom-Json
    $appId = $appInfo.id
    $appUrl = "https://cloud.digitalocean.com/apps/$appId"
    
    Write-Host "✅ ¡Aplicación creada exitosamente!" -ForegroundColor Green
    Write-Host "📱 ID de la App: $appId" -ForegroundColor White
    Write-Host "🌐 Panel de Control: $appUrl" -ForegroundColor White
    
    Write-Host "
⏳ Monitoreando despliegue..." -ForegroundColor Blue
    Write-Host "(Esto puede tomar 10-15 minutos)" -ForegroundColor Gray
    
    # Mostrar logs en tiempo real
    ./doctl apps logs $appId --follow
    
} else {
    Write-Host "❌ Error al crear la aplicación:" -ForegroundColor Red
    Write-Host $createResult -ForegroundColor Red
    
    Write-Host "
🔧 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verifica que todas las credenciales estén configuradas" -ForegroundColor White
    Write-Host "2. Asegúrate de tener suficiente cuota en tu cuenta" -ForegroundColor White
    Write-Host "3. Revisa el archivo .do/app-simple.yaml" -ForegroundColor White
    exit 1
}

Write-Host "
🎉 ¡Despliegue completado!" -ForegroundColor Green
Write-Host "Tu aplicación estará disponible en unos minutos." -ForegroundColor White
Write-Host "Revisa el panel de DigitalOcean para obtener la URL final." -ForegroundColor White