import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Hotel, Room, Service } from '@prisma/client';

@Injectable()
export class HotelService {
    constructor(private prisma: PrismaService) {}

    private readonly commonPrompts = {
        WELCOME: 'Bienvenido al Hotel Peña Linda Bungalows. ¿En qué puedo ayudarte?',
        BOOKING: 'Para hacer una reserva necesito: fechas entra y saluda, número de personas',
        PRICES: 'Las tarifas varían según temporada y tipo de habitación. ¿Para qué fechas te interesa?',
        SERVICES: 'Ofrecemos: restaurante, piscina, servicio a la habitación, estacionamiento y más. ¿Sobre cuál deseas información?'
    };

    async generateHotelResponse(userMessage: string): Promise<string> {
        if (userMessage.toLowerCase().includes('reserva')) {
            return this.commonPrompts.BOOKING;
        }
        if (userMessage.toLowerCase().includes('precio')) {
            return this.commonPrompts.PRICES;
        }
        if (userMessage.toLowerCase().includes('servicio')) {
            return this.commonPrompts.SERVICES;
        }
        return this.commonPrompts.WELCOME;
    }

    async saveHotelQuery(whatsappId: string, query: string, response: string) {
        // Primero creamos una nueva conversación
        const conversation = await this.prisma.conversation.create({
            data: {
                status: 'active',
                whatsappId: whatsappId,
                name: 'Guest',  // Nombre por defecto
                phoneNumber: whatsappId.replace('whatsapp:', ''), // Extraemos el número del whatsappId
            },
        });

        // Luego guardamos el mensaje del usuario
        const userMessage = await this.prisma.message.create({
            data: {
                whatsappId: `msg_user_${Date.now()}`,
                content: query,
                sender: whatsappId,
                conversation: {
                    connect: { id: conversation.id },
                },
            },
        });

        // Y finalmente guardamos la respuesta del bot
        const botMessage = await this.prisma.message.create({
            data: {
                whatsappId: `msg_bot_${Date.now()}`,
                content: response,
                sender: 'bot',
                conversation: {
                    connect: { id: conversation.id },
                },
            },
        });

        return { userMessage, botMessage };
    }

    async getHotelInfo(): Promise<Hotel | null> {
        return this.prisma.hotel.findFirst();
    }

    async updateHotelInfo(data: {
        name: string;
        description: string;
        address: string;
        phone: string;
        email: string;
        location: string;
    }): Promise<Hotel> {
        const hotel = await this.prisma.hotel.findFirst();

        if (hotel) {
            return this.prisma.hotel.update({
                where: { id: hotel.id },
                data,
            });
        }

        return this.prisma.hotel.create({
            data,
        });
    }

    async getAllRooms(): Promise<Room[]> {
        return this.prisma.room.findMany();
    }

    async getAvailableRooms(): Promise<Room[]> {
        return this.prisma.room.findMany({
            where: {
                status: 'available',
            },
        });
    }

    async createRoom(data: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
        return this.prisma.room.create({
            data,
        });
    }

    async updateRoom(id: string, data: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Room> {
        return this.prisma.room.update({
            where: { id },
            data,
        });
    }

    async getAllServices(): Promise<Service[]> {
        return this.prisma.service.findMany();
    }

    async createService(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
        return this.prisma.service.create({
            data,
        });
    }

    async updateService(id: string, data: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Service> {
        return this.prisma.service.update({
            where: { id },
            data,
        });
    }

    async createReservation(data: {
        guestName: string;
        roomId: string;
        checkIn: Date;
        checkOut: Date;
        whatsappNumber?: string;
    }) {
        const room = await this.prisma.room.findUnique({
            where: { id: data.roomId },
        });

        if (!room) {
            throw new Error('Habitación no encontrada');
        }

        // Si se proporciona número de WhatsApp, crear o actualizar la conversación
        let conversation = null;
        if (data.whatsappNumber) {
            conversation = await this.prisma.conversation.upsert({
                where: { whatsappId: `whatsapp:${data.whatsappNumber}` },
                create: {
                    whatsappId: `whatsapp:${data.whatsappNumber}`,
                    name: data.guestName,
                    phoneNumber: data.whatsappNumber,
                    status: 'active',
                },
                update: {
                    name: data.guestName,
                    status: 'active',
                },
            });

            // Enviar mensaje de confirmación
            await this.prisma.message.create({
                data: {
                    whatsappId: `msg_${Date.now()}`,
                    content: `¡Reserva confirmada!\nHabitación: ${room.name}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}`,
                    sender: 'system',
                    conversation: {
                        connect: { id: conversation.id }
                    }
                },
            });

            // Enviar recordatorio de check-in un día antes
            const checkInReminder = new Date(data.checkIn);
            checkInReminder.setDate(checkInReminder.getDate() - 1);
            
            await this.prisma.message.create({
                data: {
                    whatsappId: `msg_${Date.now()}_reminder`,
                    content: `Recordatorio: Mañana es su check-in en ${room.name}. ¡Lo esperamos!`,
                    sender: 'system',
                    conversation: {
                        connect: { id: conversation.id }
                    }
                },
            });
        }

        return { success: true, conversation };
    }
}
