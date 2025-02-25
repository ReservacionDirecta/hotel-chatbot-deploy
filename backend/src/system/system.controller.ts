import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SystemService } from './system.service';

@Controller('api/system')
@UseGuards(JwtAuthGuard)
export class SystemController {
    constructor(private readonly systemService: SystemService) {}

    @Get('status')
    async getSystemStatus() {
        return this.systemService.getSystemStatus();
    }

    @Get('dashboard/stats')
    async getDashboardStats() {
        return this.systemService.getDashboardStats();
    }
} 