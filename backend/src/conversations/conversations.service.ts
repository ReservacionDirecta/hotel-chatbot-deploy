import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.conversation.findMany({
      orderBy: {
        lastMessageAt: 'desc'
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
  }

  async findByWhatsappId(whatsappId: string) {
    return this.prisma.conversation.findUnique({
      where: { whatsappId }
    });
  }

  async create(data: { whatsappId: string; name: string; phoneNumber: string }) {
    return this.prisma.conversation.create({
      data: {
        whatsappId: data.whatsappId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        status: 'active'
      }
    });
  }

  async createMessage(data: { content: string; sender: string; conversationId: string }) {
    const message = await this.prisma.message.create({
      data: {
        content: data.content,
        sender: data.sender,
        whatsappId: `msg_${Date.now()}`,
        conversation: {
          connect: { id: data.conversationId }
        }
      }
    });

    // Actualizar el último mensaje de la conversación
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessage: data.content,
        lastMessageAt: new Date()
      }
    });

    return message;
  }

  async update(id: string, data: { name?: string; phoneNumber?: string; status?: string }) {
    return this.prisma.conversation.update({
      where: { id },
      data
    });
  }
} 