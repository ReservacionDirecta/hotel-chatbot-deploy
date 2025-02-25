import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AI_PROVIDERS = {
    kluster: {
        defaultApiKey: 'api:2b912469-b12e-41f6-a7a2-c065aa47197d'
    }
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getChatbotSettings() {
    try {
      this.logger.log('Buscando configuración del chatbot');
      const settings = await this.prisma.chatbotSettings.findFirst();
      
      if (!settings) {
        this.logger.log('No se encontró configuración del chatbot, creando una nueva');
        return this.prisma.chatbotSettings.create({
          data: {
            welcomeMessage: '¡Hola! Bienvenido al Hotel. ¿En qué puedo ayudarte?',
            language: 'es',
            autoReply: true
          }
        });
      }

      return settings;
    } catch (error) {
      this.logger.error('Error al obtener configuración del chatbot:', error);
      throw error;
    }
  }

  async updateChatbotSettings(data: {
    welcomeMessage?: string;
    language?: string;
    autoReply?: boolean;
  }) {
    try {
      this.logger.log('Actualizando configuración del chatbot:', data);
      const settings = await this.prisma.chatbotSettings.findFirst();

      if (!settings) {
        this.logger.log('No se encontró configuración del chatbot, creando una nueva');
        return this.prisma.chatbotSettings.create({
          data: {
            welcomeMessage: data.welcomeMessage || '¡Hola! Bienvenido al Hotel. ¿En qué puedo ayudarte?',
            language: data.language || 'es',
            autoReply: data.autoReply ?? true
          }
        });
      }

      const updated = await this.prisma.chatbotSettings.update({
        where: { id: settings.id },
        data
      });

      this.logger.log('Configuración del chatbot actualizada:', updated);
      return updated;
    } catch (error) {
      this.logger.error('Error al actualizar configuración del chatbot:', error);
      throw error;
    }
  }

  async getSecuritySettings() {
    try {
      this.logger.log('Buscando configuración de seguridad');
      const settings = await this.prisma.securitySettings.findFirst();
      
      if (!settings) {
        this.logger.log('No se encontró configuración de seguridad, creando una nueva');
        return this.prisma.securitySettings.create({
          data: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
          },
        });
      }
      
      return settings;
    } catch (error) {
      this.logger.error('Error al obtener configuración de seguridad:', error);
      throw error;
    }
  }

  async updateSecuritySettings(data: {
    twoFactorEnabled?: boolean;
    sessionTimeout?: number;
    ipWhitelist?: string;
  }) {
    try {
      this.logger.log('Actualizando configuración de seguridad:', data);
      const settings = await this.prisma.securitySettings.findFirst();
      
      if (settings) {
        const updated = await this.prisma.securitySettings.update({
          where: { id: settings.id },
          data,
        });
        this.logger.log('Configuración de seguridad actualizada:', updated);
        return updated;
      }

      this.logger.log('No se encontró configuración de seguridad, creando una nueva');
      return this.prisma.securitySettings.create({
        data: {
          twoFactorEnabled: data.twoFactorEnabled || false,
          sessionTimeout: data.sessionTimeout || 30,
          ipWhitelist: data.ipWhitelist,
        },
      });
    } catch (error) {
      this.logger.error('Error al actualizar configuración de seguridad:', error);
      throw error;
    }
  }

  async getNotificationSettings() {
    try {
      this.logger.log('Buscando configuración de notificaciones');
      const settings = await this.prisma.notificationSettings.findFirst();
      
      if (!settings) {
        this.logger.log('No se encontró configuración de notificaciones, creando una nueva');
        return this.prisma.notificationSettings.create({
          data: {
            emailEnabled: true,
            phoneEnabled: true,
            pushEnabled: true,
            notifyOnBooking: true,
            notifyOnCheckIn: true,
            notifyOnCheckOut: true,
            notifyOnMessage: true
          },
        });
      }
      
      return settings;
    } catch (error) {
      this.logger.error('Error al obtener configuración de notificaciones:', error);
      throw error;
    }
  }

  async updateNotificationSettings(data: {
    emailEnabled?: boolean;
    phoneEnabled?: boolean;
    pushEnabled?: boolean;
    notifyOnBooking?: boolean;
    notifyOnCheckIn?: boolean;
    notifyOnCheckOut?: boolean;
    notifyOnMessage?: boolean;
  }) {
    try {
      this.logger.log('Actualizando configuración de notificaciones:', data);
      const settings = await this.prisma.notificationSettings.findFirst();
      
      if (settings) {
        const updated = await this.prisma.notificationSettings.update({
          where: { id: settings.id },
          data,
        });
        this.logger.log('Configuración de notificaciones actualizada:', updated);
        return updated;
      }

      this.logger.log('No se encontró configuración de notificaciones, creando una nueva');
      return this.prisma.notificationSettings.create({
        data: {
          emailEnabled: data.emailEnabled ?? true,
          phoneEnabled: data.phoneEnabled ?? true,
          pushEnabled: data.pushEnabled ?? true,
          notifyOnBooking: data.notifyOnBooking ?? true,
          notifyOnCheckIn: data.notifyOnCheckIn ?? true,
          notifyOnCheckOut: data.notifyOnCheckOut ?? true,
          notifyOnMessage: data.notifyOnMessage ?? true
        },
      });
    } catch (error) {
      this.logger.error('Error al actualizar configuración de notificaciones:', error);
      throw error;
    }
  }

  async getAIConfig() {
    try {
      this.logger.log('Buscando configuración de IA');
      const config = await this.prisma.aIConfig.findFirst();
      
      if (!config) {
        this.logger.log('No se encontró configuración de IA, creando una nueva');
        const newConfig = await this.prisma.aIConfig.create({
          data: {
            provider: 'glhf',
            apiKey: process.env.GLHF_API_KEY || 'glhf_20267c148ccc708e74cb555eb54c2251',
            baseURL: 'https://glhf.chat/api/openai/v1',
            model: 'hf:meta-llama/Llama-3.3-70B-Instruct'
          }
        });
        this.logger.log('Nueva configuración de IA creada:', { ...newConfig, apiKey: '[REDACTED]' });
        return newConfig;
      }

      this.logger.log('Configuración de IA encontrada:', { ...config, apiKey: '[REDACTED]' });
      return config;
    } catch (error) {
      this.logger.error('Error al obtener configuración de IA:', error);
      throw error;
    }
  }

  async updateAIConfig(data: {
    provider: string;
    apiKey: string;
    baseURL: string;
    model: string;
    exchangeRate?: string;
    customInstructions?: string;
  }) {
    try {
      this.logger.log('Actualizando configuración de IA:', { ...data, apiKey: '[REDACTED]' });
      const currentConfig = await this.prisma.aIConfig.findFirst();
      
      // Usar API key existente si no se proporciona una nueva (excepto para kluster)
      const finalApiKey = data.apiKey || 
          (data.provider === 'kluster' ? AI_PROVIDERS.kluster.defaultApiKey : currentConfig?.apiKey || '');

      const updateData = {
          ...data,
          apiKey: finalApiKey,
          exchangeRate: data.exchangeRate || currentConfig?.exchangeRate || '3.70',
          customInstructions: data.customInstructions || currentConfig?.customInstructions || ''
      };

      let updatedConfig;
      
      if (currentConfig) {
        // Actualizar configuración existente
        updatedConfig = await this.prisma.aIConfig.update({
          where: { id: currentConfig.id },
          data: updateData
        });
      } else {
        // Crear nueva configuración solo si no existe
        updatedConfig = await this.prisma.aIConfig.create({
          data: updateData
        });
      }
      
      this.logger.log('Configuración de IA actualizada:', { ...updatedConfig, apiKey: '[REDACTED]' });
      return updatedConfig;
    } catch (error) {
      this.logger.error('Error al actualizar configuración de IA:', error);
      throw error;
    }
  }
} 