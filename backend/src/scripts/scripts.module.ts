import { Module } from '@nestjs/common';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ScriptsController],
    providers: [ScriptsService],
    exports: [ScriptsService]
})
export class ScriptsModule {} 