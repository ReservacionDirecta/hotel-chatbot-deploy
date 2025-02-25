# Script de despliegue para Hotel Chatbot en Windows

# Colores para mensajes
$GREEN = "Green"
$YELLOW = "Yellow"
$RED = "Red"

Write-Host "=== Iniciando despliegue de Hotel Chatbot ===" -ForegroundColor $GREEN

# Verificar estructura de directorios
Write-Host "Verificando estructura de directorios..." -ForegroundColor $YELLOW
$hotelChatbotDir = "$env:USERPROFILE\hotel-chatbot"

# Crear directorios si no existen
$directories = @(
    "$hotelChatbotDir\whatsapp-sessions\whatsapp-auth-v2",
    "$hotelChatbotDir\whatsapp-sessions\wwebjs-auth",
    "$hotelChatbotDir\whatsapp-sessions\wwebjs-cache",
    "$hotelChatbotDir\uploads",
    "$hotelChatbotDir\data",
    "$hotelChatbotDir\exports"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Creado directorio: $dir" -ForegroundColor $GREEN
    }
}

# Copiar archivos del proyecto actual al directorio de despliegue
Write-Host "Copiando archivos del proyecto..." -ForegroundColor $YELLOW
$currentDir = Get-Location

# Crear directorios de destino si no existen
if (-not (Test-Path "$hotelChatbotDir\backend")) {
    New-Item -ItemType Directory -Path "$hotelChatbotDir\backend" -Force
}
if (-not (Test-Path "$hotelChatbotDir\frontend")) {
    New-Item -ItemType Directory -Path "$hotelChatbotDir\frontend" -Force
}

# Copiar archivos
Copy-Item -Path "$currentDir\backend\*" -Destination "$hotelChatbotDir\backend" -Recurse -Force
Copy-Item -Path "$currentDir\frontend\*" -Destination "$hotelChatbotDir\frontend" -Recurse -Force

# Crear enlaces simbólicos para persistencia (en Windows se usan junction points)
Write-Host "Creando enlaces para persistencia..." -ForegroundColor $YELLOW
$junctions = @{
    "$hotelChatbotDir\backend\whatsapp-auth-v2" = "$hotelChatbotDir\whatsapp-sessions\whatsapp-auth-v2"
    "$hotelChatbotDir\backend\.wwebjs_auth"     = "$hotelChatbotDir\whatsapp-sessions\wwebjs-auth"
    "$hotelChatbotDir\backend\.wwebjs_cache"    = "$hotelChatbotDir\whatsapp-sessions\wwebjs-cache"
    "$hotelChatbotDir\backend\uploads"          = "$hotelChatbotDir\uploads"
    "$hotelChatbotDir\backend\data"             = "$hotelChatbotDir\data"
    "$hotelChatbotDir\backend\exports"          = "$hotelChatbotDir\exports"
}

foreach ($junction in $junctions.GetEnumerator()) {
    $target = $junction.Key
    $source = $junction.Value
    
    # Eliminar el enlace existente si existe
    if (Test-Path $target) {
        if ((Get-Item $target).LinkType -eq "Junction") {
            Remove-Item -Path $target -Force
        }
        else {
            Remove-Item -Path $target -Recurse -Force
        }
    }
    
    # Crear nuevo enlace
    New-Item -ItemType Junction -Path $target -Target $source
    Write-Host "Creado enlace: $target -> $source" -ForegroundColor $GREEN
}

# Actualizar archivo .env del backend
Write-Host "Actualizando configuración del backend..." -ForegroundColor $YELLOW
$backendEnvPath = "$hotelChatbotDir\backend\.env"
$backendEnvContent = Get-Content "$currentDir\backend\.env" -Raw
$backendEnvContent = $backendEnvContent -replace "WHATSAPP_PUPPETEER_EXECUTABLE_PATH=.*", "WHATSAPP_PUPPETEER_EXECUTABLE_PATH=`"C:\Program Files\Google\Chrome\Application\chrome.exe`""
Set-Content -Path $backendEnvPath -Value $backendEnvContent

# Actualizar archivo .env.local del frontend
Write-Host "Actualizando configuración del frontend..." -ForegroundColor $YELLOW
$frontendEnvPath = "$hotelChatbotDir\frontend\.env.local"
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet).IPAddress
if (-not $ipAddress) {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
}
if (-not $ipAddress) {
    $ipAddress = "localhost"
}

$frontendEnvContent = @"
NEXT_PUBLIC_API_URL=http://$ipAddress:4000/api

# Aplicación
NEXT_PUBLIC_APP_URL=http://$ipAddress:3000

# Autenticación
NEXT_PUBLIC_JWT_EXPIRES_IN="1d"
"@
Set-Content -Path $frontendEnvPath -Value $frontendEnvContent

# Desplegar Backend
Write-Host "Desplegando backend..." -ForegroundColor $YELLOW
Set-Location "$hotelChatbotDir\backend"

# Instalar dependencias y construir
Write-Host "Instalando dependencias del backend..." -ForegroundColor $YELLOW
npm install

Write-Host "Generando cliente Prisma..." -ForegroundColor $YELLOW
npm run prisma:generate

Write-Host "Construyendo backend..." -ForegroundColor $YELLOW
npm run build

# Desplegar Frontend
Write-Host "Desplegando frontend..." -ForegroundColor $YELLOW
Set-Location "$hotelChatbotDir\frontend"

# Instalar dependencias y construir
Write-Host "Instalando dependencias del frontend..." -ForegroundColor $YELLOW
npm install

Write-Host "Construyendo frontend..." -ForegroundColor $YELLOW
npm run build

# Iniciar con PM2
Write-Host "Configurando PM2..." -ForegroundColor $YELLOW
Set-Location "$hotelChatbotDir\backend"
pm2 delete hotel-chatbot-backend 2>$null
pm2 start dist/main.js --name hotel-chatbot-backend

Set-Location "$hotelChatbotDir\frontend"
pm2 delete hotel-chatbot-frontend 2>$null
pm2 start npm --name hotel-chatbot-frontend -- start

# Guardar configuración de PM2
pm2 save

Write-Host "=== Despliegue completado con éxito ===" -ForegroundColor $GREEN
Write-Host "Backend: http://$ipAddress:4000/api" -ForegroundColor $GREEN
Write-Host "Frontend: http://$ipAddress:3000" -ForegroundColor $GREEN

# Volver al directorio original
Set-Location $currentDir 