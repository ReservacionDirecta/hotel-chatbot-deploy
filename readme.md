# Hotel Chatbot - Guía de Despliegue

Esta es una versión optimizada del proyecto Hotel Chatbot para despliegue en VPS.

## Requisitos Previos

- Node.js 18.x o superior
- PostgreSQL
- Google Chrome (para WhatsApp Web)
- PM2 (para gestión de procesos)

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

## Pasos para el Despliegue

1. Clonar este repositorio en el servidor:

   ```bash
   git clone https://github.com/ReservacionDirecta/hotel-chatbot-deploy.git ~/hotel-chatbot-repo
   ```

2. Copiar los archivos al directorio de la aplicación:

   ```bash
   mkdir -p ~/hotel-chatbot
   cp -r ~/hotel-chatbot-repo/backend ~/hotel-chatbot/
   cp -r ~/hotel-chatbot-repo/frontend ~/hotel-chatbot/
   ```

3. Configurar variables de entorno:

   ```bash
   cp ~/hotel-chatbot/backend/.env.example ~/hotel-chatbot/backend/.env
   cp ~/hotel-chatbot/frontend/.env.example ~/hotel-chatbot/frontend/.env.local
   ```

   Editar los archivos .env según sea necesario.

4. Ejecutar el script de despliegue:
   ```bash
   cd ~/hotel-chatbot-repo
   ./deploy.sh
   ```

## Verificación

- Backend: http://165.154.254.43:4000/api
- Frontend: http://165.154.254.43:3000

## Mantenimiento

- Ver logs:

  ```bash
  pm2 logs hotel-chatbot-backend
  pm2 logs hotel-chatbot-frontend
  ```

- Reiniciar servicios:

  ```bash
  pm2 restart hotel-chatbot-backend
  pm2 restart hotel-chatbot-frontend
  ```

- Actualizar desde el repositorio:
  ```bash
  cd ~/hotel-chatbot-repo
  git pull
  ./deploy.sh
  ```
  EOL
