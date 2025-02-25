#!/bin/bash

# Script para configurar Nginx con HTTPS para Hotel Chatbot

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando configuración de Nginx para Hotel Chatbot ===${NC}"

# Instalar Nginx si no está instalado
echo -e "${YELLOW}Verificando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}Instalando Nginx...${NC}"
  sudo apt update
  sudo apt install -y nginx
fi

# Instalar Certbot para certificados SSL
echo -e "${YELLOW}Instalando Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx

# Crear configuración de Nginx
echo -e "${YELLOW}Creando configuración de Nginx...${NC}"
sudo tee /etc/nginx/sites-available/hotel-chatbot.conf > /dev/null << 'EOL'
server {
    listen 80;
    server_name 165.154.254.43;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Habilitar el sitio
echo -e "${YELLOW}Habilitando el sitio...${NC}"
sudo ln -sf /etc/nginx/sites-available/hotel-chatbot.conf /etc/nginx/sites-enabled/

# Verificar configuración de Nginx
echo -e "${YELLOW}Verificando configuración de Nginx...${NC}"
sudo nginx -t

# Reiniciar Nginx
echo -e "${YELLOW}Reiniciando Nginx...${NC}"
sudo systemctl restart nginx

# Configurar firewall
echo -e "${YELLOW}Configurando firewall...${NC}"
sudo ufw allow 'Nginx Full'
sudo ufw status

echo -e "${GREEN}=== Configuración de Nginx completada con éxito ===${NC}"
echo -e "${GREEN}Ahora puede acceder a la aplicación en: http://165.154.254.43${NC}"
echo -e "${YELLOW}Para configurar HTTPS, ejecute:${NC}"
echo -e "${YELLOW}sudo certbot --nginx -d su-dominio.com${NC}" 