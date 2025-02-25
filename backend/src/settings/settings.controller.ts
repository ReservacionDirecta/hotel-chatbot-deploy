import { Controller, Get, Put, Post, Body, UseGuards, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get('chatbot')
  async getChatbotSettings() {
    try {
      this.logger.log('Obteniendo configuración del chatbot');
      return await this.settingsService.getChatbotSettings();
    } catch (error) {
      this.logger.error('Error al obtener configuración del chatbot:', error);
      throw new HttpException(
        'Error al obtener configuración del chatbot',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('chatbot')
  async updateChatbotSettings(
    @Body()
    data: {
      language?: string;
      welcomeMessage?: string;
      goodbyeMessage?: string;
    },
  ) {
    try {
      this.logger.log('Actualizando configuración del chatbot:', data);
      return await this.settingsService.updateChatbotSettings(data);
    } catch (error) {
      this.logger.error('Error al actualizar configuración del chatbot:', error);
      throw new HttpException(
        'Error al actualizar configuración del chatbot',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('security')
  async getSecuritySettings() {
    try {
      this.logger.log('Obteniendo configuración de seguridad');
      return await this.settingsService.getSecuritySettings();
    } catch (error) {
      this.logger.error('Error al obtener configuración de seguridad:', error);
      throw new HttpException(
        'Error al obtener configuración de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('security')
  async updateSecuritySettings(
    @Body()
    data: {
      twoFactorEnabled?: boolean;
      sessionTimeout?: number;
      ipWhitelist?: string;
    },
  ) {
    try {
      this.logger.log('Actualizando configuración de seguridad:', data);
      return await this.settingsService.updateSecuritySettings(data);
    } catch (error) {
      this.logger.error('Error al actualizar configuración de seguridad:', error);
      throw new HttpException(
        'Error al actualizar configuración de seguridad',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('notifications')
  async getNotificationSettings() {
    try {
      this.logger.log('Obteniendo configuración de notificaciones');
      return await this.settingsService.getNotificationSettings();
    } catch (error) {
      this.logger.error('Error al obtener configuración de notificaciones:', error);
      throw new HttpException(
        'Error al obtener configuración de notificaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('notifications')
  async updateNotificationSettings(
    @Body()
    data: {
      emailEnabled?: boolean;
      phoneEnabled?: boolean;
      pushEnabled?: boolean;
      notifyOnBooking?: boolean;
      notifyOnCheckIn?: boolean;
      notifyOnCheckOut?: boolean;
      notifyOnMessage?: boolean;
    },
  ) {
    try {
      this.logger.log('Actualizando configuración de notificaciones:', data);
      return await this.settingsService.updateNotificationSettings(data);
    } catch (error) {
      this.logger.error('Error al actualizar configuración de notificaciones:', error);
      throw new HttpException(
        'Error al actualizar configuración de notificaciones',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('ai')
  async getAIConfig() {
    try {
      this.logger.log('Obteniendo configuración de IA');
      const config = await this.settingsService.getAIConfig();
      this.logger.log('Configuración de IA obtenida:', { ...config, apiKey: '[REDACTED]' });
      return config;
    } catch (error) {
      this.logger.error('Error al obtener configuración de IA:', error);
      throw new HttpException(
        'Error al obtener configuración de IA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('ai')
  async updateAIConfig(
    @Body() data: {
      provider: string;
      apiKey: string;
      baseURL: string;
      model: string;
      exchangeRate?: string;
      customInstructions?: string;
    }
  ) {
    try {
      // Validación mejorada de campos
      if (!data.provider) {
        throw new HttpException('El proveedor es requerido', HttpStatus.BAD_REQUEST);
      }

      if (!data.model) {
        throw new HttpException('El modelo es requerido', HttpStatus.BAD_REQUEST);
      }

      // Validar baseURL solo si no es un proveedor predefinido
      if (!data.baseURL && data.provider !== 'kluster' && data.provider !== 'glhf') {
        throw new HttpException('La URL base es requerida', HttpStatus.BAD_REQUEST);
      }

      // Validar apiKey solo si no es kluster o si se proporciona explícitamente
      if (!data.apiKey && data.provider !== 'kluster') {
        throw new HttpException('La API Key es requerida', HttpStatus.BAD_REQUEST);
      }

      // Validar tipo de cambio si se proporciona
      if (data.exchangeRate && isNaN(parseFloat(data.exchangeRate))) {
        throw new HttpException('El tipo de cambio debe ser un número válido', HttpStatus.BAD_REQUEST);
      }

      this.logger.log('Actualizando configuración de IA:', { ...data, apiKey: '[REDACTED]' });
      
      const config = await this.settingsService.updateAIConfig(data);
      this.logger.log('Configuración de IA actualizada:', { ...config, apiKey: '[REDACTED]' });
      return config;
    } catch (error) {
      this.logger.error('Error al actualizar configuración de IA:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Error al actualizar configuración de IA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 