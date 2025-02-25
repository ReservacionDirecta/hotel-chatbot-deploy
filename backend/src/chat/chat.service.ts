import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappServiceV2 } from '../whatsapp/whatsapp.service.v2';
import { SettingsService } from '../settings/settings.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        private whatsappService: WhatsappServiceV2,
        private settingsService: SettingsService,
        private aiService: AIService
    ) {}

    async getConversations(userId: string) {
        try {
            console.log('Obteniendo conversaciones de la base de datos...');
            const conversations = await this.prisma.conversation.findMany({
                where: {
                    messages: {
                        some: {}
                    }
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1,
                        select: {
                            content: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: {
                    lastMessageAt: 'desc'
                },
                take: 50
            });

            console.log(`Encontradas ${conversations.length} conversaciones`);
            return conversations.map(conversation => ({
                id: conversation.id,
                contact: conversation.name || conversation.phoneNumber || 'Sin nombre',
                lastMessage: conversation.messages[0]?.content || 'No hay mensajes',
                timestamp: conversation.messages[0]?.createdAt || conversation.lastMessageAt || new Date(),
                unread: false
            }));
        } catch (error) {
            console.error('Error al obtener conversaciones:', error);
            throw error;
        }
    }

    async getMessages(userId: string) {
        const messages = await this.prisma.message.findMany({
            where: {
                conversation: {
                    messages: {
                        some: {
                            sender: userId
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                conversation: true
            }
        });

        return {
            messages: messages.map(message => ({
                id: message.id,
                role: message.sender === userId ? 'user' : 'assistant',
                content: message.content,
                timestamp: message.createdAt
            }))
        };
    }

    async getConversationMessages(userId: string, conversationId: string) {
        try {
            console.log(`Obteniendo mensajes para la conversación ${conversationId}`);
            const conversation = await this.prisma.conversation.findFirst({
                where: {
                    id: conversationId
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 50,
                        select: {
                            id: true,
                            content: true,
                            sender: true,
                            createdAt: true,
                            status: true
                        }
                    }
                }
            });

            if (!conversation) {
                throw new NotFoundException('Conversación no encontrada');
            }

            console.log(`Encontrados ${conversation.messages.length} mensajes`);
            return {
                messages: conversation.messages.reverse().map(message => ({
                    id: message.id,
                    content: message.content,
                    sender: message.sender,
                    timestamp: message.createdAt,
                    status: message.status
                }))
            };
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            throw error;
        }
    }

    async sendMessage(userId: string, conversationId: string, content: string, botEnabled: boolean = false) {
        try {
            // Obtener la conversación
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId }
            });

            if (!conversation) {
                throw new Error('Conversación no encontrada');
            }

            // Crear el mensaje en la base de datos con estado 'sending'
            const message = await this.prisma.message.create({
                data: {
                    content,
                    sender: 'admin',
                    status: 'sending',
                    whatsappId: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    conversation: {
                        connect: { id: conversationId }
                    }
                }
            });

            try {
                // Enviar mensaje por WhatsApp
                await this.whatsappService.sendMessage(conversation.phoneNumber, content);
                
                // Actualizar el estado del mensaje a 'sent'
                const updatedMessage = await this.prisma.message.update({
                    where: { id: message.id },
                    data: { status: 'sent' }
                });

                // Actualizar el último mensaje de la conversación
                await this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: {
                        lastMessage: content,
                        lastMessageAt: new Date()
                    }
                });

                // Solo devolver el mensaje actualizado
                return {
                    message: {
                        id: updatedMessage.id,
                        content: updatedMessage.content,
                        sender: updatedMessage.sender,
                        timestamp: updatedMessage.createdAt,
                        status: updatedMessage.status
                    }
                };
            } catch (error) {
                // Si falla el envío por WhatsApp, actualizar el estado a 'error'
                await this.prisma.message.update({
                    where: { id: message.id },
                    data: { status: 'error' }
                });
                throw error;
            }
        } catch (error) {
            console.error('Error en sendMessage:', error);
            throw error;
        }
    }

    private generateBotResponse(userMessage: string): string {
        // Palabras clave comunes en consultas de hotel
        const keywords = {
            reserva: ['reserva', 'reservar', 'reservación', 'disponibilidad', 'disponible'],
            precios: ['precio', 'costo', 'tarifa', 'cuánto', 'cuanto'],
            habitaciones: ['habitación', 'habitaciones', 'cuarto', 'cuartos', 'suite'],
            servicios: ['servicio', 'servicios', 'wifi', 'internet', 'piscina', 'restaurante'],
            ubicacion: ['ubicación', 'dirección', 'donde', 'dónde', 'llegar'],
            horarios: ['horario', 'hora', 'check-in', 'checkout', 'entrada', 'salida']
        };

        const message = userMessage.toLowerCase();

        // Verificar coincidencias con palabras clave
        if (keywords.reserva.some(word => message.includes(word))) {
            return "Para hacer una reserva, necesito algunos detalles: fechas de entrada y salida, número de personas y tipo de habitación que prefieres. ¿Podrías proporcionarme esta información?";
        }

        if (keywords.precios.some(word => message.includes(word))) {
            return "Los precios varían según el tipo de habitación y temporada. ¿Para qué fechas estás interesado y qué tipo de habitación prefieres?";
        }

        if (keywords.habitaciones.some(word => message.includes(word))) {
            return "Contamos con diferentes tipos de habitaciones: individuales, dobles, suites y habitaciones familiares. Cada una está equipada con baño privado, TV y aire acondicionado. ¿Qué tipo de habitación te interesa?";
        }

        if (keywords.servicios.some(word => message.includes(word))) {
            return "Ofrecemos varios servicios: WiFi gratuito, piscina, restaurante, servicio a la habitación, estacionamiento y más. ¿Hay algún servicio específico sobre el que quieras saber más?";
        }

        if (keywords.ubicacion.some(word => message.includes(word))) {
            return "Nos encontramos en una ubicación privilegiada, cerca del centro de la ciudad. ¿Necesitas indicaciones específicas para llegar?";
        }

        if (keywords.horarios.some(word => message.includes(word))) {
            return "Nuestro horario de check-in es a partir de las 14:00 y el check-out hasta las 12:00 del mediodía. ¿Necesitas un horario especial?";
        }

        // Respuesta por defecto si no hay coincidencias
        return "Gracias por tu mensaje. ¿En qué puedo ayudarte con respecto a tu estancia en nuestro hotel?";
    }

    async handleAudioMessage(userId: string, file: Express.Multer.File) {
        // Aquí implementarías la lógica para procesar el audio
        // Por ahora solo devolvemos un mensaje de éxito
        return {
            success: true,
            message: 'Audio recibido correctamente'
        };
    }
} 