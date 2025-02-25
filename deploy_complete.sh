#!/bin/bash

# Script maestro para el despliegue completo de Hotel Chatbot

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando despliegue completo de Hotel Chatbot ===${NC}"

# Verificar si los scripts existen
if [ ! -f setup_server.sh ] || [ ! -f deploy_hotel_chatbot.sh ] || [ ! -f setup_nginx.sh ]; then
  echo -e "${RED}Faltan scripts necesarios. Descargando...${NC}"
  
  # Descargar scripts
  wget -O setup_server.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/setup_server.sh
  wget -O deploy_hotel_chatbot.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/deploy_hotel_chatbot.sh
  wget -O setup_nginx.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/setup_nginx.sh
  
  # Hacer ejecutables los scripts
  chmod +x setup_server.sh deploy_hotel_chatbot.sh setup_nginx.sh
fi

# Paso 1: Configurar el servidor
echo -e "${YELLOW}Paso 1: Configurando el servidor...${NC}"
./setup_server.sh

# Paso 2: Desplegar la aplicación
echo -e "${YELLOW}Paso 2: Desplegando la aplicación...${NC}"
./deploy_hotel_chatbot.sh

# Paso 3: Configurar Nginx
echo -e "${YELLOW}Paso 3: Configurando Nginx...${NC}"
./setup_nginx.sh

echo -e "${GREEN}=== Despliegue completo finalizado con éxito ===${NC}"
echo -e "${GREEN}La aplicación está disponible en: http://165.154.254.43${NC}"
echo -e "${YELLOW}Recuerde actualizar las variables de entorno si es necesario.${NC}"

# Mostrar estado de los servicios
echo -e "${YELLOW}Estado de los servicios:${NC}"
pm2 status
sudo systemctl status postgresql | grep Active
sudo systemctl status nginx | grep Active 