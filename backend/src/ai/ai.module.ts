import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScriptsModule } from '../scripts/scripts.module';
import { RoomsModule } from '../rooms/rooms.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        PrismaModule, 
        ScriptsModule, 
        RoomsModule
    ],
    controllers: [AIController],
    providers: [
        AIService,
        {
            provide: 'CACHE_OPTIONS',
            useValue: {
                ttl: 300, // 5 minutos
                max: 100 // máximo 100 items en caché
            }
        }
    ],
    exports: [AIService]
})
export class AIModule {} 