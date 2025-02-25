#!/bin/bash

# Script de configuración del servidor para Hotel Chatbot

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando configuración del servidor para Hotel Chatbot ===${NC}"

# Actualizar el sistema
echo -e "${YELLOW}Actualizando el sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
echo -e "${YELLOW}Instalando Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# Instalar PM2
echo -e "${YELLOW}Instalando PM2...${NC}"
sudo npm install -g pm2
pm2 -v

# Instalar PostgreSQL
echo -e "${YELLOW}Instalando PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql | cat

# Configurar PostgreSQL
echo -e "${YELLOW}Configurando PostgreSQL...${NC}"
# Crear usuario y base de datos
sudo -u postgres psql -c "CREATE USER hotel_user WITH PASSWORD 'Chmb@2025';"
sudo -u postgres psql -c "CREATE DATABASE hotel_chatbot;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hotel_chatbot TO hotel_user;"
sudo -u postgres psql -c "ALTER USER hotel_user WITH SUPERUSER;"

# Instalar Google Chrome (necesario para WhatsApp Web)
echo -e "${YELLOW}Instalando Google Chrome...${NC}"
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb
google-chrome --version
rm google-chrome-stable_current_amd64.deb

# Crear estructura de directorios
echo -e "${YELLOW}Creando estructura de directorios...${NC}"
mkdir -p ~/hotel-chatbot/backend
mkdir -p ~/hotel-chatbot/frontend
mkdir -p ~/hotel-chatbot/whatsapp-sessions/whatsapp-auth-v2
mkdir -p ~/hotel-chatbot/whatsapp-sessions/wwebjs-auth
mkdir -p ~/hotel-chatbot/whatsapp-sessions/wwebjs-cache
mkdir -p ~/hotel-chatbot/uploads
mkdir -p ~/hotel-chatbot/data
mkdir -p ~/hotel-chatbot/exports

# Clonar el repositorio
echo -e "${YELLOW}Clonando repositorio...${NC}"
git clone https://github.com/ReservacionDirecta/hotel-chatbot-deploy.git ~/hotel-chatbot-repo

# Copiar archivos al directorio de la aplicación
echo -e "${YELLOW}Copiando archivos al directorio de la aplicación...${NC}"
cp -r ~/hotel-chatbot-repo/backend/* ~/hotel-chatbot/backend/
cp -r ~/hotel-chatbot-repo/frontend/* ~/hotel-chatbot/frontend/

# Configurar variables de entorno
echo -e "${YELLOW}Configurando variables de entorno...${NC}"
# Backend
cp ~/hotel-chatbot/backend/.env.example ~/hotel-chatbot/backend/.env
# Actualizar la URL de la base de datos
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://hotel_user:Chmb%402025@localhost:5432/hotel_chatbot"|g' ~/hotel-chatbot/backend/.env
# Actualizar CORS_ORIGIN
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN="http://165.154.254.43:3000"|g' ~/hotel-chatbot/backend/.env
# Actualizar ruta de Chrome
sed -i 's|WHATSAPP_PUPPETEER_EXECUTABLE_PATH=.*|WHATSAPP_PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"|g' ~/hotel-chatbot/backend/.env

# Frontend
cp ~/hotel-chatbot/frontend/.env.example ~/hotel-chatbot/frontend/.env.local
# Actualizar API URL
sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://165.154.254.43:4000/api|g' ~/hotel-chatbot/frontend/.env.local
# Actualizar APP URL
sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://165.154.254.43:3000|g' ~/hotel-chatbot/frontend/.env.local

echo -e "${GREEN}=== Configuración del servidor completada con éxito ===${NC}"
echo -e "${GREEN}Ahora puede ejecutar el script de despliegue: ./deploy_hotel_chatbot.sh${NC}" 