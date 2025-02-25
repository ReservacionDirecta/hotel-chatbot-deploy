import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        try {
            console.log('Consultando todas las habitaciones...');
            const rooms = await this.prisma.room.findMany({
                include: {
                    occupancyRates: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            console.log(`Se encontraron ${rooms.length} habitaciones en total`);
            
            // Convertir strings JSON a arrays
            const processedRooms = rooms.map(room => {
                const amenities = room.amenities ? JSON.parse(room.amenities as string) : [];
                const images = room.images ? JSON.parse(room.images as string) : [];
                
                console.log(`Habitación ${room.name}:`, {
                    tipo: room.type,
                    capacidad: room.capacity,
                    estado: room.status,
                    tarifaBase: room.rackRate,
                    tarifasOcupacion: room.occupancyRates.length
                });

                return {
                    ...room,
                    amenities,
                    images
                };
            });

            console.log('Procesamiento de habitaciones completado');
            return processedRooms;
        } catch (error) {
            console.error('Error en findAll:', error);
            throw new Error('Error al obtener las habitaciones');
        }
    }

    async create(data: {
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
        try {
            // Convertir arrays a strings
            const amenitiesString = Array.isArray(data.amenities) 
                ? data.amenities.join(',') 
                : data.amenities;
            
            const imagesString = Array.isArray(data.images) 
                ? data.images.join(',') 
                : data.images;

            // Crear tarifas de ocupación por defecto
            const now = new Date();
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            const occupancyRates = data.occupancyRates?.map(rate => ({
                startDate: now,
                endDate: endOfYear,
                rate: rate.price
            })) || [];

            return this.prisma.room.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    capacity: data.capacity,
                    rackRate: data.rackRate,
                    offerRate: data.offerRate,
                    amenities: amenitiesString,
                    images: imagesString,
                    status: data.status || 'available',
                    hotelId: data.hotelId,
                    occupancyRates: {
                        create: occupancyRates
                    }
                },
                include: {
                    occupancyRates: true
                }
            });
        } catch (error) {
            console.error('Error creating room:', error);
            throw new Error('Error al crear la habitación');
        }
    }

    async update(id: string, data: {
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
    }) {
        try {
            // Convertir arrays a strings si es necesario
            const amenitiesString = data.amenities && Array.isArray(data.amenities) 
                ? data.amenities.join(',') 
                : data.amenities;
            
            const imagesString = data.images && Array.isArray(data.images) 
                ? data.images.join(',') 
                : data.images;

            // Actualizar tarifas de ocupación si se proporcionan
            const now = new Date();
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            const occupancyRates = data.occupancyRates?.map(rate => ({
                startDate: now,
                endDate: endOfYear,
                rate: rate.price
            }));

            const updateData: any = {
                name: data.name,
                type: data.type,
                description: data.description,
                capacity: data.capacity,
                rackRate: data.rackRate,
                offerRate: data.offerRate,
                status: data.status,
            };

            if (amenitiesString !== undefined) {
                updateData.amenities = amenitiesString;
            }

            if (imagesString !== undefined) {
                updateData.images = imagesString;
            }

            if (occupancyRates) {
                updateData.occupancyRates = {
                    deleteMany: {},
                    create: occupancyRates
                };
            }

            return this.prisma.room.update({
                where: { id },
                data: updateData,
                include: {
                    occupancyRates: true
                }
            });
        } catch (error) {
            console.error('Error updating room:', error);
            throw new Error('Error al actualizar la habitación');
        }
    }

    async delete(id: string) {
        // Eliminar primero las tarifas de ocupación
        await this.prisma.occupancyRate.deleteMany({
            where: { roomId: id }
        });

        // Luego eliminar la habitación
        return this.prisma.room.delete({
            where: { id }
        });
    }

    async duplicate(id: string) {
        // Obtener la habitación original con sus tarifas
        const original = await this.prisma.room.findUnique({
            where: { id },
            include: {
                occupancyRates: true
            }
        });

        if (!original) {
            throw new Error('Habitación no encontrada');
        }

        // Crear una copia con un nuevo nombre
        const { id: _, occupancyRates, ...roomData } = original;
        const newName = `${original.name} (copia)`;

        return this.prisma.room.create({
            data: {
                ...roomData,
                name: newName,
                occupancyRates: {
                    create: occupancyRates
                }
            },
            include: {
                occupancyRates: true
            }
        });
    }

    async findById(id: string) {
        try {
            const room = await this.prisma.room.findUnique({
                where: { id },
                include: {
                    occupancyRates: true
                }
            });

            if (!room) {
                throw new Error('Habitación no encontrada');
            }

            // Convertir strings JSON a arrays en la respuesta
            return {
                ...room,
                amenities: room.amenities ? JSON.parse(room.amenities as string) : [],
                images: room.images ? JSON.parse(room.images as string) : []
            };
        } catch (error) {
            console.error('Error en findById:', error);
            throw new Error('Error al obtener la habitación');
        }
    }
} 