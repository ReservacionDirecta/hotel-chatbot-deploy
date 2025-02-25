import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SettingsService } from '../settings/settings.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async sendNotification(
    userId: string,
    type: 'booking' | 'checkIn' | 'checkOut' | 'message',
    data: any
  ) {
    try {
      // Obtener configuración de notificaciones del usuario
      const settings = await this.settingsService.getNotificationSettings();
      
      if (!settings) {
        this.logger.warn('No se encontró configuración de notificaciones');
        return;
      }

      // Verificar si el tipo de notificación está habilitado
      const shouldNotify = this.shouldSendNotification(settings, type);
      if (!shouldNotify) {
        this.logger.debug(`Notificaciones de tipo ${type} están deshabilitadas`);
        return;
      }

      // Crear registro de notificación
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          content: JSON.stringify(data),
          read: false
        }
      });

      // Enviar por diferentes canales según la configuración
      if (settings.emailEnabled) {
        await this.sendEmail(userId, type, data);
      }

      if (settings.phoneEnabled) {
        await this.sendWhatsApp(userId, type, data);
      }

      if (settings.pushEnabled) {
        await this.sendPushNotification(userId, type, data);
      }

      // Emitir evento de nueva notificación
      this.eventEmitter.emit('notification.created', notification);

      return notification;
    } catch (error) {
      this.logger.error('Error al enviar notificación:', error);
      throw error;
    }
  }

  private shouldSendNotification(settings: any, type: string): boolean {
    switch (type) {
      case 'booking':
        return settings.notifyOnBooking;
      case 'checkIn':
        return settings.notifyOnCheckIn;
      case 'checkOut':
        return settings.notifyOnCheckOut;
      case 'message':
        return settings.notifyOnMessage;
      default:
        return false;
    }
  }

  private async sendEmail(userId: string, type: string, data: any) {
    try {
      // Implementar lógica de envío de email
      this.logger.log(`Enviando email para ${type} al usuario ${userId}`);
      // TODO: Integrar con servicio de email
    } catch (error) {
      this.logger.error('Error al enviar email:', error);
    }
  }

  private async sendWhatsApp(userId: string, type: string, data: any) {
    try {
      // Implementar lógica de envío de WhatsApp
      this.logger.log(`Enviando WhatsApp para ${type} al usuario ${userId}`);
      // TODO: Integrar con servicio de WhatsApp
    } catch (error) {
      this.logger.error('Error al enviar WhatsApp:', error);
    }
  }

  private async sendPushNotification(userId: string, type: string, data: any) {
    try {
      // Implementar lógica de envío de notificación push
      this.logger.log(`Enviando push notification para ${type} al usuario ${userId}`);
      // TODO: Integrar con servicio de notificaciones push
    } catch (error) {
      this.logger.error('Error al enviar notificación push:', error);
    }
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async markAsRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });
  }
} 