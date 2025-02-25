# Hotel Chatbot - Guía de Despliegue

Esta es una versión optimizada del proyecto Hotel Chatbot para despliegue en VPS.

## Requisitos Previos

- Ubuntu 20.04 LTS o superior
- Node.js 18.x o superior
- PostgreSQL
- Google Chrome (para WhatsApp Web)
- PM2 (para gestión de procesos)
- Nginx (para servir la aplicación)

## Estructura de Directorios

~/hotel-chatbot/
├── backend/ # Código del backend
├── frontend/ # Código del frontend
├── whatsapp-sessions/ # Sesiones persistentes de WhatsApp
│ ├── whatsapp-auth-v2/
│ ├── wwebjs-auth/
│ └── wwebjs-cache/
├── uploads/ # Archivos subidos
├── data/ # Datos persistentes
└── exports/ # Archivos exportados

## Despliegue Rápido

Para un despliegue rápido y completo, siga estos pasos:

1. Conéctese a su servidor:

   ```bash
   ssh ubuntu@165.154.254.43
   ```

2. Descargue el script de despliegue completo:

   ```bash
   wget -O deploy_complete.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/deploy_complete.sh
   chmod +x deploy_complete.sh
   ```

3. Ejecute el script:

   ```bash
   ./deploy_complete.sh
   ```

Este script realizará automáticamente los siguientes pasos:
- Configuración del servidor (instalación de dependencias)
- Despliegue de la aplicación
- Configuración de Nginx

## Despliegue Manual

Si prefiere realizar el despliegue paso a paso, siga estas instrucciones:

### 1. Configuración del Servidor

```bash
wget -O setup_server.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/setup_server.sh
chmod +x setup_server.sh
./setup_server.sh
```

Este script instalará:
- Node.js 18.x
- PM2
- PostgreSQL
- Google Chrome

### 2. Despliegue de la Aplicación

```bash
wget -O deploy_hotel_chatbot.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/deploy_hotel_chatbot.sh
chmod +x deploy_hotel_chatbot.sh
./deploy_hotel_chatbot.sh
```

### 3. Configuración de Nginx

```bash
wget -O setup_nginx.sh https://raw.githubusercontent.com/ReservacionDirecta/hotel-chatbot-deploy/main/setup_nginx.sh
chmod +x setup_nginx.sh
./setup_nginx.sh
```

## Verificación

- Backend: http://165.154.254.43:4000/api
- Frontend: http://165.154.254.43:3000
- Aplicación (con Nginx): http://165.154.254.43

## Mantenimiento

### Ver logs

```bash
pm2 logs hotel-chatbot-backend
pm2 logs hotel-chatbot-frontend
```

### Reiniciar servicios

```bash
pm2 restart hotel-chatbot-backend
pm2 restart hotel-chatbot-frontend
```

### Actualizar desde el repositorio

```bash
cd ~/hotel-chatbot-repo
git pull
./deploy_hotel_chatbot.sh
```

### Verificar estado de los servicios

```bash
pm2 status
sudo systemctl status postgresql
sudo systemctl status nginx
```

## Solución de Problemas

### Base de datos

Si tiene problemas con la conexión a la base de datos:

```bash
# Verificar que PostgreSQL está en ejecución
sudo systemctl status postgresql

# Verificar la conexión a la base de datos
cd ~/hotel-chatbot/backend
node -e "const { Client } = require('pg'); const client = new Client({ user: 'hotel_user', host: 'localhost', database: 'hotel_chatbot', password: 'Chmb@2025', port: 5432 }); client.connect().then(() => { console.log('Conexión exitosa'); client.end(); }).catch(err => { console.error('Error:', err); client.end(); });"
```

### WhatsApp

Si tiene problemas con la conexión de WhatsApp:

```bash
# Verificar que Google Chrome está instalado
google-chrome --version

# Reiniciar el servicio de backend
pm2 restart hotel-chatbot-backend
```

### Nginx

Si tiene problemas con Nginx:

```bash
# Verificar la configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```
