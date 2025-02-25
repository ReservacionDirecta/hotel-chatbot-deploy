import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { WhatsappControllerV2 } from './whatsapp.controller.v2';
import { WhatsappServiceV2 } from './whatsapp.service.v2';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AIModule } from '../ai/ai.module';
import { SystemModule } from '../system/system.module';
import { ChatModule } from '../chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import whatsappConfig from '../config/whatsapp.config';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    AIModule,
    forwardRef(() => SystemModule),
    forwardRef(() => ChatModule),
    ConfigModule.forFeature(whatsappConfig)
  ],
  controllers: [WhatsappControllerV2],
  providers: [
    {
      provide: WhatsappServiceV2,
      useClass: WhatsappServiceV2
    }
  ],
  exports: [WhatsappServiceV2],
})
export class WhatsappModule implements OnModuleInit {
  constructor(
    private readonly whatsappService: WhatsappServiceV2
  ) {}

  async onModuleInit() {
    try {
      console.log('Iniciando servicio de WhatsApp v2...');
      await this.whatsappService.onModuleInit();
      console.log('WhatsApp v2 inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar servicio de WhatsApp:', error);
    }
  }
} 