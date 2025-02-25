#!/bin/bash

# Script de despliegue para Hotel Chatbot

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando despliegue de Hotel Chatbot ===${NC}"

# Verificar estructura de directorios
echo -e "${YELLOW}Verificando estructura de directorios...${NC}"
mkdir -p ~/hotel-chatbot/whatsapp-sessions/whatsapp-auth-v2
mkdir -p ~/hotel-chatbot/whatsapp-sessions/wwebjs-auth
mkdir -p ~/hotel-chatbot/whatsapp-sessions/wwebjs-cache
mkdir -p ~/hotel-chatbot/uploads
mkdir -p ~/hotel-chatbot/data
mkdir -p ~/hotel-chatbot/exports

# Desplegar Backend
echo -e "${YELLOW}Desplegando backend...${NC}"
cd ~/hotel-chatbot/backend

# Crear enlaces simbólicos para persistencia
ln -sf ~/hotel-chatbot/whatsapp-sessions/whatsapp-auth-v2 ./whatsapp-auth-v2
ln -sf ~/hotel-chatbot/whatsapp-sessions/wwebjs-auth ./.wwebjs_auth
ln -sf ~/hotel-chatbot/whatsapp-sessions/wwebjs-cache ./.wwebjs_cache
ln -sf ~/hotel-chatbot/uploads ./uploads
ln -sf ~/hotel-chatbot/data ./data
ln -sf ~/hotel-chatbot/exports ./exports

# Instalar dependencias y construir
echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
npm install

echo -e "${YELLOW}Generando cliente Prisma...${NC}"
npm run prisma:generate

echo -e "${YELLOW}Construyendo backend...${NC}"
npm run build

# Desplegar Frontend
echo -e "${YELLOW}Desplegando frontend...${NC}"
cd ~/hotel-chatbot/frontend

# Instalar dependencias y construir
echo -e "${YELLOW}Instalando dependencias del frontend...${NC}"
npm install

echo -e "${YELLOW}Construyendo frontend...${NC}"
npm run build

# Iniciar con PM2
echo -e "${YELLOW}Configurando PM2...${NC}"
cd ~/hotel-chatbot/backend
pm2 delete hotel-chatbot-backend 2>/dev/null || true
pm2 start dist/main.js --name hotel-chatbot-backend

cd ~/hotel-chatbot/frontend
pm2 delete hotel-chatbot-frontend 2>/dev/null || true
pm2 start npm --name hotel-chatbot-frontend -- start

# Guardar configuración de PM2
pm2 save

echo -e "${GREEN}=== Despliegue completado con éxito ===${NC}"
echo -e "${GREEN}Backend: http://$(hostname -I | awk '{print $1}'):4000/api${NC}"
echo -e "${GREEN}Frontend: http://$(hostname -I | awk '{print $1}'):3000${NC}"
