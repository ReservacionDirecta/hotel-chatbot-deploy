import { Injectable } from '@nestjs/common';
import { WhatsappServiceV2 } from '../whatsapp/whatsapp.service.v2';
import { AIService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SystemService {
    constructor(
        private readonly whatsappService: WhatsappServiceV2,
        private readonly aiService: AIService,
        private readonly prismaService: PrismaService,
        private readonly settingsService: SettingsService
    ) {}

    async getSystemStatus() {
        const whatsappStatus = await this.whatsappService.getStatus();
        const aiConfig = await this.settingsService.getAIConfig();

        return {
            whatsappConnection: whatsappStatus.connected ? 'connected' : 'disconnected',
            aiStatus: 'online', // Por ahora hardcodeado, podría implementarse una verificación real
            aiModel: aiConfig.model || 'gpt-3.5-turbo',
            lastUpdate: new Date()
        };
    }

    async getDashboardStats() {
        // Obtener usuarios activos (conectados en las últimas 24 horas)
        const activeUsers = await this.prismaService.user.count({
            where: {
                updatedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });

        // Obtener total de conversaciones
        const totalConversations = await this.prismaService.conversation.count();

        // Calcular tiempo promedio de respuesta (últimas 100 conversaciones)
        const recentMessages = await this.prismaService.message.findMany({
            where: {
                sender: 'bot'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100,
            select: {
                id: true,
                createdAt: true,
                conversationId: true
            }
        });

        let totalResponseTime = 0;
        let validResponses = 0;

        // Procesar cada mensaje del bot para encontrar el mensaje del usuario correspondiente
        for (const botMessage of recentMessages) {
            const userMessage = await this.prismaService.message.findFirst({
                where: {
                    conversationId: botMessage.conversationId,
                    sender: 'user',
                    createdAt: {
                        lt: botMessage.createdAt
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    createdAt: true
                }
            });

            if (userMessage) {
                const responseTime = botMessage.createdAt.getTime() - userMessage.createdAt.getTime();
                if (responseTime > 0) {
                    totalResponseTime += responseTime;
                    validResponses++;
                }
            }
        }

        const averageResponseTime = validResponses > 0 
            ? `${Math.round(totalResponseTime / validResponses / 1000)}s`
            : '0s';

        // Obtener total de consultas IA
        const aiQueriesHandled = await this.prismaService.message.count({
            where: {
                sender: 'bot'
            }
        });

        return {
            activeUsers,
            totalConversations,
            averageResponseTime,
            aiQueriesHandled
        };
    }
} 