import { Module, forwardRef } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemGateway } from './system.gateway';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AIModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@Module({
    imports: [
        forwardRef(() => WhatsappModule),
        AIModule,
        PrismaModule,
        SettingsModule,
        AuthModule,
        UsersModule
    ],
    controllers: [SystemController],
    providers: [
        SystemService, 
        SystemGateway,
        WsJwtGuard
    ],
    exports: [SystemService, SystemGateway]
})
export class SystemModule {} 