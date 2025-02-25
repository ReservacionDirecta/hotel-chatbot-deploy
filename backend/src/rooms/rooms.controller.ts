import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Get()
    async findAll() {
        return this.roomsService.findAll();
    }

    @Post()
    async create(@Body() data: {
        name: string;
        type: string;
        description: string;
        capacity: number;
        rackRate: number;
        offerRate?: number;
        amenities: string[];
        images: string[];
        status: string;
        hotelId: string;
        occupancyRates: {
            occupancy: number;
            price: number;
        }[];
    }) {
        return this.roomsService.create(data);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: {
            name?: string;
            type?: string;
            description?: string;
            capacity?: number;
            rackRate?: number;
            offerRate?: number;
            amenities?: string[];
            images?: string[];
            status?: string;
            occupancyRates?: {
                occupancy: number;
                price: number;
            }[];
        }
    ) {
        return this.roomsService.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.roomsService.delete(id);
    }

    @Post(':id/duplicate')
    async duplicate(@Param('id') id: string) {
        return this.roomsService.duplicate(id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.roomsService.findById(id);
    }
} 