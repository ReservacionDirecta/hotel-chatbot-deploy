import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Crear usuario administrador
  await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      email: 'admin@hotel.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'admin',
    },
  });

  // Crear scripts predefinidos
  const scripts = [
    {
      name: 'Saludo',
      description: 'Mensaje de bienvenida',
      active: true,
      triggers: JSON.stringify([
        'hola', 'buenos días', 'buenas tardes', 'buenas noches',
        'saludos', 'que tal', 'hi', 'hello'
      ]),
      response: '¡Hola! Bienvenido al Hotel. Soy el asistente virtual, ¿en qué puedo ayudarte hoy?'
    },
    {
      name: 'Despedida',
      description: 'Mensaje de despedida',
      active: true,
      triggers: JSON.stringify([
        'adiós', 'chau', 'hasta luego', 'nos vemos',
        'gracias', 'bye', 'goodbye'
      ]),
      response: '¡Gracias por contactarnos! Si necesitas algo más, no dudes en preguntarme. ¡Que tengas un excelente día!'
    },
    {
      name: 'Check-in',
      description: 'Información sobre check-in',
      active: true,
      triggers: JSON.stringify([
        'check in', 'checkin', 'entrada', 'hora de entrada',
        'a que hora puedo entrar', 'cuando puedo entrar'
      ]),
      response: 'El horario de check-in es a partir de las 14:00 horas. Si necesitas un horario especial, por favor contáctanos con anticipación y haremos lo posible por acomodarnos a tus necesidades.'
    },
    {
      name: 'Check-out',
      description: 'Información sobre check-out',
      active: true,
      triggers: JSON.stringify([
        'check out', 'checkout', 'salida', 'hora de salida',
        'a que hora debo salir', 'cuando debo salir'
      ]),
      response: 'El horario de check-out es hasta las 12:00 del mediodía. Si necesitas extender tu estancia, por favor consúltanos sobre la disponibilidad y tarifas aplicables.'
    },
    {
      name: 'Servicios',
      description: 'Información sobre servicios del hotel',
      active: true,
      triggers: JSON.stringify([
        'servicios', 'que ofrecen', 'que incluye', 'amenidades',
        'facilidades', 'que hay en el hotel'
      ]),
      response: 'Nuestro hotel cuenta con los siguientes servicios:\n- WiFi gratuito en todas las áreas\n- Restaurante y bar\n- Servicio a la habitación 24/7\n- Piscina y gimnasio\n- Estacionamiento gratuito\n- Servicio de lavandería\n- Business center\n¿Te gustaría más información sobre algún servicio en particular?'
    },
    {
      name: 'Ubicación',
      description: 'Información sobre la ubicación del hotel',
      active: true,
      triggers: JSON.stringify([
        'ubicación', 'donde están', 'dirección', 'como llego',
        'donde quedan', 'donde se encuentran'
      ]),
      response: 'Nos encontramos en una ubicación privilegiada en el centro de la ciudad. Nuestra dirección es [DIRECCIÓN DEL HOTEL]. Estamos a:\n- 10 minutos del aeropuerto\n- 5 minutos de la plaza principal\n- Cerca de las principales atracciones turísticas\n¿Necesitas indicaciones específicas para llegar?'
    },
    {
      name: 'Reserva',
      description: 'Proceso de reserva',
      active: true,
      triggers: JSON.stringify([
        'reservar', 'hacer reserva', 'reservación', 'quiero reservar',
        'como reservo', 'disponibilidad'
      ]),
      response: 'Para hacer una reserva necesitamos la siguiente información:\n1. Fechas de entrada y salida\n2. Número de personas\n3. Tipo de habitación deseada\n4. Datos de contacto\n\nPuedes hacer tu reserva:\n- Directamente en nuestra web\n- Por teléfono al [NÚMERO]\n- Por email a [EMAIL]\n\n¿Te gustaría proceder con una reserva?'
    }
  ];

  for (const script of scripts) {
    await prisma.script.upsert({
      where: { 
        id: script.name === 'Saludo' ? 1 : 
           script.name === 'Despedida' ? 2 :
           script.name === 'Check-in' ? 3 :
           script.name === 'Check-out' ? 4 :
           script.name === 'Servicios' ? 5 :
           script.name === 'Ubicación' ? 6 : 7
      },
      update: script,
      create: script,
    });
  }

  console.log('Base de datos sembrada correctamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
