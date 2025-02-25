import { PrismaClient } from '@prisma/client';
import { createObjectCsvWriter } from 'csv-writer';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportTableToCSV(
  modelName: string,
  getData: () => Promise<any[]>,
  headers: { id: string; title: string }[],
) {
  const outputPath = path.resolve(__dirname, '..', '..', 'exports', `${modelName}.csv`);
  
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: headers,
  });

  try {
    const data = await getData();
    await csvWriter.writeRecords(data);
    console.log(`✅ Datos exportados exitosamente para ${modelName}`);
  } catch (error) {
    console.error(`❌ Error exportando ${modelName}:`, error);
  }
}

async function exportAllData() {
  // Exportar Users
  await exportTableToCSV(
    'users',
    () => prisma.user.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'email', title: 'Email' },
      { id: 'name', title: 'Nombre' },
      { id: 'role', title: 'Rol' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Hotels
  await exportTableToCSV(
    'hotels',
    () => prisma.hotel.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Nombre' },
      { id: 'description', title: 'Descripción' },
      { id: 'location', title: 'Ubicación' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Rooms
  await exportTableToCSV(
    'rooms',
    () => prisma.room.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Nombre' },
      { id: 'type', title: 'Tipo' },
      { id: 'description', title: 'Descripción' },
      { id: 'capacity', title: 'Capacidad' },
      { id: 'rackRate', title: 'Tarifa Rack' },
      { id: 'offerRate', title: 'Tarifa Oferta' },
      { id: 'amenities', title: 'Amenidades' },
      { id: 'images', title: 'Imágenes' },
      { id: 'status', title: 'Estado' },
      { id: 'hotelId', title: 'ID del Hotel' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Services
  await exportTableToCSV(
    'services',
    () => prisma.service.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Nombre' },
      { id: 'description', title: 'Descripción' },
      { id: 'price', title: 'Precio' },
      { id: 'hotelId', title: 'ID del Hotel' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Scripts
  await exportTableToCSV(
    'scripts',
    () => prisma.script.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Nombre' },
      { id: 'description', title: 'Descripción' },
      { id: 'active', title: 'Activo' },
      { id: 'triggers', title: 'Triggers' },
      { id: 'response', title: 'Respuesta' },
      { id: 'category', title: 'Categoría' },
      { id: 'requiresDate', title: 'Requiere Fecha' },
      { id: 'requiresRoomType', title: 'Requiere Tipo de Habitación' },
      { id: 'requiresOccupancy', title: 'Requiere Ocupación' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Conversations
  await exportTableToCSV(
    'conversations',
    () => prisma.conversation.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'whatsappId', title: 'ID de WhatsApp' },
      { id: 'name', title: 'Nombre' },
      { id: 'phoneNumber', title: 'Número de Teléfono' },
      { id: 'status', title: 'Estado' },
      { id: 'lastMessage', title: 'Último Mensaje' },
      { id: 'lastMessageAt', title: 'Fecha del Último Mensaje' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Training
  await exportTableToCSV(
    'training',
    () => prisma.training.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'filename', title: 'Nombre del Archivo' },
      { id: 'filepath', title: 'Ruta del Archivo' },
      { id: 'status', title: 'Estado' },
      { id: 'progress', title: 'Progreso' },
      { id: 'error', title: 'Error' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar AIConfig
  await exportTableToCSV(
    'ai-config',
    () => prisma.aIConfig.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'provider', title: 'Proveedor' },
      { id: 'apiKey', title: 'API Key' },
      { id: 'baseURL', title: 'URL Base' },
      { id: 'model', title: 'Modelo' },
      { id: 'exchangeRate', title: 'Tipo de Cambio' },
      { id: 'customInstructions', title: 'Instrucciones Personalizadas' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Messages
  await exportTableToCSV(
    'messages',
    () => prisma.message.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'whatsappId', title: 'ID de WhatsApp' },
      { id: 'content', title: 'Contenido' },
      { id: 'sender', title: 'Remitente' },
      { id: 'status', title: 'Estado' },
      { id: 'metadata', title: 'Metadatos' },
      { id: 'conversationId', title: 'ID de Conversación' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar OccupancyRates
  await exportTableToCSV(
    'occupancy-rates',
    () => prisma.occupancyRate.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'startDate', title: 'Fecha de Inicio' },
      { id: 'endDate', title: 'Fecha de Fin' },
      { id: 'rate', title: 'Tarifa' },
      { id: 'roomId', title: 'ID de Habitación' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar HotelSettings
  await exportTableToCSV(
    'hotel-settings',
    () => prisma.hotelSettings.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Nombre' },
      { id: 'address', title: 'Dirección' },
      { id: 'phone', title: 'Teléfono' },
      { id: 'email', title: 'Email' },
      { id: 'checkInTime', title: 'Hora de Check-in' },
      { id: 'checkOutTime', title: 'Hora de Check-out' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar ChatbotSettings
  await exportTableToCSV(
    'chatbot-settings',
    () => prisma.chatbotSettings.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'welcomeMessage', title: 'Mensaje de Bienvenida' },
      { id: 'language', title: 'Idioma' },
      { id: 'autoReply', title: 'Respuesta Automática' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar SecuritySettings
  await exportTableToCSV(
    'security-settings',
    () => prisma.securitySettings.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'twoFactorEnabled', title: 'Autenticación de Dos Factores' },
      { id: 'sessionTimeout', title: 'Tiempo de Sesión' },
      { id: 'ipWhitelist', title: 'Lista Blanca de IPs' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar NotificationSettings
  await exportTableToCSV(
    'notification-settings',
    () => prisma.notificationSettings.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'emailEnabled', title: 'Notificaciones por Email' },
      { id: 'phoneEnabled', title: 'Notificaciones por Teléfono' },
      { id: 'pushEnabled', title: 'Notificaciones Push' },
      { id: 'notifyOnBooking', title: 'Notificar en Reservas' },
      { id: 'notifyOnCheckIn', title: 'Notificar en Check-in' },
      { id: 'notifyOnCheckOut', title: 'Notificar en Check-out' },
      { id: 'notifyOnMessage', title: 'Notificar en Mensajes' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Settings
  await exportTableToCSV(
    'settings',
    () => prisma.settings.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'personality', title: 'Personalidad' },
      { id: 'language', title: 'Idioma' },
      { id: 'responseTime', title: 'Tiempo de Respuesta' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  // Exportar Customers
  await exportTableToCSV(
    'customers',
    () => prisma.customer.findMany(),
    [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Nombre' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Teléfono' },
      { id: 'dni', title: 'DNI' },
      { id: 'address', title: 'Dirección' },
      { id: 'nationality', title: 'Nacionalidad' },
      { id: 'preferences', title: 'Preferencias' },
      { id: 'status', title: 'Estado' },
      { id: 'createdAt', title: 'Fecha de Creación' },
      { id: 'updatedAt', title: 'Fecha de Actualización' },
    ],
  );

  await prisma.$disconnect();
}

// Ejecutar la exportación
exportAllData()
  .then(() => {
    console.log('🎉 Exportación completada exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error durante la exportación:', error);
    process.exit(1);
  }); 
