import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SettingsModule } from './settings/settings.module';
import { AIModule } from './ai/ai.module';
import { ScriptsModule } from './scripts/scripts.module';
import { RoomsModule } from './rooms/rooms.module';
import { SystemModule } from './system/system.module';
import { TrainingModule } from './training/training.module';
import whatsappConfig from './config/whatsapp.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [whatsappConfig]
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChatModule,
    WhatsappModule,
    SettingsModule,
    AIModule,
    ScriptsModule,
    RoomsModule,
    SystemModule,
    TrainingModule,
  ],
})
export class AppModule {}
