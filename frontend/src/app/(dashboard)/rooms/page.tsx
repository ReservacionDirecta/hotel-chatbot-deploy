'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Plus,
    Pencil,
    Trash2,
    BedDouble,
    Users,
    Copy
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Room {
    id: string
    name: string
    type: string
    description: string
    capacity: number
    rackRate: number
    offerRate?: number
    amenities: string[]
    images: string[]
    status: 'available' | 'occupied' | 'maintenance'
    occupancyRates: {
        id?: string
        occupancy: number
        price: number
        roomId?: string
    }[]
}

export default function RoomsPage() {
    const { token } = useAuth()
    const [rooms, setRooms] = useState<Room[]>([])
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
    const [newFeature, setNewFeature] = useState('')

    useEffect(() => {
        if (!token) return
        loadRooms()
    }, [token])

    // Función para crear múltiples habitaciones matrimoniales
    const createMatrimonialRooms = async () => {
        const defaultAmenities = [
            'WiFi',
            'Agua caliente',
            'Balcón privado',
            'Vista al mar',
            'Limpieza diaria',
            'Servicio a la habitación',
            'TV Satelital',
            'Frigobar'
        ];

        const rooms = [
            // Habitaciones Piso Superior
            {
                name: 'Matrimonial - Piso superior - USD - Año Nuevo y Fiestas Patrias',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 135,
                occupancyRates: [
                    { occupancy: 1, price: 135 },
                    { occupancy: 2, price: 135 }
                ]
            },
            {
                name: 'Matrimonial - Piso superior - USD - Domingo a jueves / Temp Alta',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 80,
                occupancyRates: [
                    { occupancy: 1, price: 80 },
                    { occupancy: 2, price: 80 }
                ]
            },
            {
                name: 'Matrimonial - Piso superior - USD - Domingo a jueves Temporada Baja',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 62,
                occupancyRates: [
                    { occupancy: 1, price: 62 },
                    { occupancy: 2, price: 62 }
                ]
            },
            {
                name: 'Matrimonial - Piso superior - USD - Fin de semana Temp baja',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 69,
                occupancyRates: [
                    { occupancy: 1, price: 69 },
                    { occupancy: 2, price: 69 }
                ]
            },
            {
                name: 'Matrimonial - Piso superior - USD - Fines de semana / Temp. Alta',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 80,
                occupancyRates: [
                    { occupancy: 1, price: 80 },
                    { occupancy: 2, price: 80 }
                ]
            },
            {
                name: 'Matrimonial - Piso superior - USD - Verano 2025',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 80,
                occupancyRates: [
                    { occupancy: 1, price: 80 },
                    { occupancy: 2, price: 80 }
                ]
            },
            // Habitaciones Primer Piso
            {
                name: 'Matrimonial - Primer Piso - USD - Año Nuevo y Fiestas Patrias',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 155,
                occupancyRates: [
                    { occupancy: 1, price: 155 },
                    { occupancy: 2, price: 155 }
                ]
            },
            {
                name: 'Matrimonial - Primer Piso - USD - Domingo a jueves / Temp Alta',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 100,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 }
                ]
            },
            {
                name: 'Matrimonial - Primer Piso - USD - Domingo a jueves Temporada Baja',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 82,
                occupancyRates: [
                    { occupancy: 1, price: 82 },
                    { occupancy: 2, price: 82 }
                ]
            },
            {
                name: 'Matrimonial - Primer Piso - USD - Fin de semana Temp baja',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 89,
                occupancyRates: [
                    { occupancy: 1, price: 89 },
                    { occupancy: 2, price: 89 }
                ]
            },
            {
                name: 'Matrimonial - Primer Piso - USD - Fines de semana / Temp. Alta',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 100,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 }
                ]
            },
            {
                name: 'Matrimonial - Primer Piso - USD - Verano 2025',
                type: 'Matrimonial',
                description: 'Balcon con vista al mar',
                capacity: 2,
                rackRate: 100,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 155 }
                ]
            }
        ];

        let createdCount = 0;
        for (const roomData of rooms) {
            try {
                const newRoom = {
                    ...roomData,
                    amenities: defaultAmenities,
                    images: [],
                    status: 'available',
                    hotelId: process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || ''
                };

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const response = await fetch(`${apiUrl}/rooms`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(newRoom)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al crear ${roomData.name}: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                setRooms(prev => [...prev, data]);
                createdCount++;
                toast.success(`Habitación "${roomData.name}" creada correctamente (${createdCount}/${rooms.length})`);
            } catch (error) {
                console.error('Error:', error);
                toast.error(error instanceof Error ? error.message : `Error al crear ${roomData.name}`);
            }
        }

        if (createdCount === rooms.length) {
            toast.success(`Se crearon todas las habitaciones (${createdCount} en total)`);
        }
    };

    const createQuadrupleRooms = async () => {
        const defaultAmenities = [
            'WiFi',
            'Agua caliente',
            'Balcón privado',
            'Vista al mar',
            'Limpieza diaria',
            'Servicio a la habitación',
            'TV Satelital',
            'Frigobar'
        ];

        const rooms = [
            // Habitaciones Cuádruples Piso Superior
            {
                name: 'Cuádruple - Piso superior - USD - Año Nuevo y Fiestas Patrias',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 175,
                occupancyRates: [
                    { occupancy: 1, price: 135 },
                    { occupancy: 2, price: 135 },
                    { occupancy: 3, price: 155 },
                    { occupancy: 4, price: 175 }
                ]
            },
            {
                name: 'Cuádruple - Piso superior - USD - Domingo a jueves / Temp Alta',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 120,
                occupancyRates: [
                    { occupancy: 1, price: 80 },
                    { occupancy: 2, price: 80 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 }
                ]
            },
            {
                name: 'Cuádruple - Piso superior - USD - Domingo a jueves Temporada Baja',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 102,
                occupancyRates: [
                    { occupancy: 1, price: 62 },
                    { occupancy: 2, price: 62 },
                    { occupancy: 3, price: 82 },
                    { occupancy: 4, price: 102 }
                ]
            },
            {
                name: 'Cuádruple - Piso superior - USD - Fin de semana Temp baja',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 109,
                occupancyRates: [
                    { occupancy: 1, price: 69 },
                    { occupancy: 2, price: 69 },
                    { occupancy: 3, price: 89 },
                    { occupancy: 4, price: 109 }
                ]
            },
            {
                name: 'Cuádruple - Piso superior - USD - Fines de semana / Temp. Alta',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 120,
                occupancyRates: [
                    { occupancy: 1, price: 80 },
                    { occupancy: 2, price: 80 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 }
                ]
            },
            {
                name: 'Cuádruple - Piso superior - USD - Verano 2025',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 140,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 }
                ]
            },
            // Habitaciones Cuádruples Primer Piso
            {
                name: 'Cuádruple - Primer piso - USD - Año Nuevo y Fiestas Patrias',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 195,
                occupancyRates: [
                    { occupancy: 1, price: 155 },
                    { occupancy: 2, price: 155 },
                    { occupancy: 3, price: 175 },
                    { occupancy: 4, price: 195 }
                ]
            },
            {
                name: 'Cuádruple - Primer piso - USD - Domingo a jueves / Temp Alta',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 140,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 }
                ]
            },
            {
                name: 'Cuádruple - Primer piso - USD - Domingo a jueves Temporada Baja',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 122,
                occupancyRates: [
                    { occupancy: 1, price: 82 },
                    { occupancy: 2, price: 82 },
                    { occupancy: 3, price: 102 },
                    { occupancy: 4, price: 122 }
                ]
            },
            {
                name: 'Cuádruple - Primer piso - USD - Fin de semana Temp baja',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 129,
                occupancyRates: [
                    { occupancy: 1, price: 89 },
                    { occupancy: 2, price: 89 },
                    { occupancy: 3, price: 109 },
                    { occupancy: 4, price: 129 }
                ]
            },
            {
                name: 'Cuádruple - Primer piso - USD - Fines de semana / Temp. Alta',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 140,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 }
                ]
            },
            {
                name: 'Cuádruple - Primer piso - USD - Verano 2025',
                type: 'Cuádruple',
                description: 'Balcon con vista al mar',
                capacity: 4,
                rackRate: 140,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 }
                ]
            }
        ];

        let createdCount = 0;
        for (const roomData of rooms) {
            try {
                const newRoom = {
                    ...roomData,
                    amenities: defaultAmenities,
                    images: [],
                    status: 'available',
                    hotelId: process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || ''
                };

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const response = await fetch(`${apiUrl}/rooms`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(newRoom)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al crear ${roomData.name}: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                setRooms(prev => [...prev, data]);
                createdCount++;
                toast.success(`Habitación "${roomData.name}" creada correctamente (${createdCount}/${rooms.length})`);
            } catch (error) {
                console.error('Error:', error);
                toast.error(error instanceof Error ? error.message : `Error al crear ${roomData.name}`);
            }
        }

        if (createdCount === rooms.length) {
            toast.success(`Se crearon todas las habitaciones cuádruples (${createdCount} en total)`);
        }
    };

    const createFamilyRooms = async () => {
        const defaultAmenities = [
            'WiFi',
            'Agua caliente',
            'Balcón privado',
            'Vista al mar',
            'Limpieza diaria',
            'Servicio a la habitación',
            'TV Satelital',
            'Frigobar'
        ];

        const rooms = [
            // Habitaciones Familiares Piso Superior
            {
                name: 'Familiar - Piso superior - USD - Año Nuevo y Fiestas Patrias',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 215,
                occupancyRates: [
                    { occupancy: 1, price: 155 },
                    { occupancy: 2, price: 155 },
                    { occupancy: 3, price: 155 },
                    { occupancy: 4, price: 175 },
                    { occupancy: 5, price: 195 },
                    { occupancy: 6, price: 215 }
                ]
            },
            {
                name: 'Familiar - Piso superior - USD - Domingo a jueves / Temp Alta',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 161,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 },
                    { occupancy: 5, price: 140 },
                    { occupancy: 6, price: 161 }
                ]
            },
            {
                name: 'Familiar - Piso superior - USD - Domingo a jueves Temporada Baja',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 162,
                occupancyRates: [
                    { occupancy: 1, price: 102 },
                    { occupancy: 2, price: 102 },
                    { occupancy: 3, price: 102 },
                    { occupancy: 4, price: 122 },
                    { occupancy: 5, price: 142 },
                    { occupancy: 6, price: 162 }
                ]
            },
            {
                name: 'Familiar - Piso superior - USD - Fin de semana Temp baja',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 169,
                occupancyRates: [
                    { occupancy: 1, price: 109 },
                    { occupancy: 2, price: 109 },
                    { occupancy: 3, price: 109 },
                    { occupancy: 4, price: 129 },
                    { occupancy: 5, price: 149 },
                    { occupancy: 6, price: 169 }
                ]
            },
            {
                name: 'Familiar - Piso superior - USD - Fines de semana / Temp. Alta',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 160,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 },
                    { occupancy: 5, price: 140 },
                    { occupancy: 6, price: 160 }
                ]
            },
            {
                name: 'Familiar - Piso superior - USD - Verano 2025',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 160,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 },
                    { occupancy: 5, price: 140 },
                    { occupancy: 6, price: 160 }
                ]
            },
            // Habitaciones Familiares Piso Superior con Altillo
            {
                name: 'Familiar - Piso superior con altillo - USD - Año Nuevo y Fiestas Patrias',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 215,
                occupancyRates: [
                    { occupancy: 1, price: 155 },
                    { occupancy: 2, price: 155 },
                    { occupancy: 3, price: 155 },
                    { occupancy: 4, price: 175 },
                    { occupancy: 5, price: 195 },
                    { occupancy: 6, price: 215 }
                ]
            },
            {
                name: 'Familiar - Piso superior con altillo - USD - Domingo a jueves / Temp Alta',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 160,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 },
                    { occupancy: 5, price: 140 },
                    { occupancy: 6, price: 160 }
                ]
            },
            {
                name: 'Familiar - Piso superior con altillo - USD - Domingo a jueves Temporada Baja',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 162,
                occupancyRates: [
                    { occupancy: 1, price: 102 },
                    { occupancy: 2, price: 102 },
                    { occupancy: 3, price: 102 },
                    { occupancy: 4, price: 122 },
                    { occupancy: 5, price: 142 },
                    { occupancy: 6, price: 162 }
                ]
            },
            {
                name: 'Familiar - Piso superior con altillo - USD - Fin de semana Temp baja',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 169,
                occupancyRates: [
                    { occupancy: 1, price: 109 },
                    { occupancy: 2, price: 109 },
                    { occupancy: 3, price: 109 },
                    { occupancy: 4, price: 129 },
                    { occupancy: 5, price: 149 },
                    { occupancy: 6, price: 169 }
                ]
            },
            {
                name: 'Familiar - Piso superior con altillo - USD - Fines de semana / Temp. Alta',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 160,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 },
                    { occupancy: 5, price: 140 },
                    { occupancy: 6, price: 160 }
                ]
            },
            {
                name: 'Familiar - Piso superior con altillo - USD - Verano 2025',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 160,
                occupancyRates: [
                    { occupancy: 1, price: 100 },
                    { occupancy: 2, price: 100 },
                    { occupancy: 3, price: 100 },
                    { occupancy: 4, price: 120 },
                    { occupancy: 5, price: 140 },
                    { occupancy: 6, price: 160 }
                ]
            },
            // Habitaciones Familiares Primer Piso
            {
                name: 'Familiar - Primer piso - USD - Año Nuevo y Fiestas Patrias',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 180,
                occupancyRates: [
                    { occupancy: 1, price: 120 },
                    { occupancy: 2, price: 120 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 },
                    { occupancy: 5, price: 160 },
                    { occupancy: 6, price: 180 }
                ]
            },
            {
                name: 'Familiar - Primer piso - USD - Domingo a jueves / Temp Alta',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 180,
                occupancyRates: [
                    { occupancy: 1, price: 120 },
                    { occupancy: 2, price: 120 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 },
                    { occupancy: 5, price: 160 },
                    { occupancy: 6, price: 180 }
                ]
            },
            {
                name: 'Familiar - Primer piso - USD - Domingo a jueves Temporada Baja',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 182,
                occupancyRates: [
                    { occupancy: 1, price: 122 },
                    { occupancy: 2, price: 122 },
                    { occupancy: 3, price: 122 },
                    { occupancy: 4, price: 142 },
                    { occupancy: 5, price: 162 },
                    { occupancy: 6, price: 182 }
                ]
            },
            {
                name: 'Familiar - Primer piso - USD - Fin de semana Temp baja',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 169,
                occupancyRates: [
                    { occupancy: 1, price: 109 },
                    { occupancy: 2, price: 109 },
                    { occupancy: 3, price: 109 },
                    { occupancy: 4, price: 129 },
                    { occupancy: 5, price: 149 },
                    { occupancy: 6, price: 169 }
                ]
            },
            {
                name: 'Familiar - Primer piso - USD - Fines de semana / Temp. Alta',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 180,
                occupancyRates: [
                    { occupancy: 1, price: 120 },
                    { occupancy: 2, price: 120 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 },
                    { occupancy: 5, price: 160 },
                    { occupancy: 6, price: 180 }
                ]
            },
            {
                name: 'Familiar - Primer piso - USD - Verano 2025',
                type: 'Familiar',
                description: 'Balcon con vista al mar',
                capacity: 6,
                rackRate: 180,
                occupancyRates: [
                    { occupancy: 1, price: 120 },
                    { occupancy: 2, price: 120 },
                    { occupancy: 3, price: 120 },
                    { occupancy: 4, price: 140 },
                    { occupancy: 5, price: 160 },
                    { occupancy: 6, price: 180 }
                ]
            }
        ];

        let createdCount = 0;
        for (const roomData of rooms) {
            try {
                const newRoom = {
                    ...roomData,
                    amenities: defaultAmenities,
                    images: [],
                    status: 'available',
                    hotelId: process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || ''
                };

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const response = await fetch(`${apiUrl}/rooms`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(newRoom)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al crear ${roomData.name}: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                setRooms(prev => [...prev, data]);
                createdCount++;
                toast.success(`Habitación "${roomData.name}" creada correctamente (${createdCount}/${rooms.length})`);
            } catch (error) {
                console.error('Error:', error);
                toast.error(error instanceof Error ? error.message : `Error al crear ${roomData.name}`);
            }
        }

        if (createdCount === rooms.length) {
            toast.success(`Se crearon todas las habitaciones familiares (${createdCount} en total)`);
        }
    };

    const loadRooms = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            console.log('Intentando cargar habitaciones desde:', `${apiUrl}/rooms`);

            const response = await fetch(`${apiUrl}/rooms`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Habitaciones cargadas:', data);

            // Asegurarse de que data sea un array
            if (!Array.isArray(data)) {
                console.error('La respuesta no es un array:', data);
                throw new Error('Formato de respuesta inválido');
            }

            // Asegurarse de que las features y occupancyRates estén en el formato correcto
            const formattedRooms = data.map(room => ({
                ...room,
                amenities: Array.isArray(room.amenities) ? room.amenities :
                    typeof room.amenities === 'string' ? JSON.parse(room.amenities) : [],
                occupancyRates: room.occupancyRates || []
            }));

            setRooms(formattedRooms);
            toast.success(`${formattedRooms.length} habitaciones cargadas correctamente`);
        } catch (error) {
            console.error('Error detallado:', error);
            toast.error(error instanceof Error ? error.message : 'Error al cargar las habitaciones');
            // Inicializar con array vacío en caso de error
            setRooms([]);
        }
    };

    const handleEdit = (room: Room) => {
        setEditingRoom({ ...room })
        setIsDialogOpen(true)
    }

    const handleDelete = async (room: Room) => {
        setRoomToDelete(room)
        setDeleteConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (!roomToDelete) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/rooms/${roomToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) throw new Error('Error al eliminar habitación')

            setRooms(rooms.filter(r => r.id !== roomToDelete.id))
            toast.success('Habitación eliminada correctamente')
            setDeleteConfirmOpen(false)
            setRoomToDelete(null)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al eliminar la habitación')
        }
    }

    const handleSave = async () => {
        if (!editingRoom) return;
        if (!token) {
            toast.error('No hay sesión activa');
            return;
        }

        // Validación de campos requeridos
        const requiredFields = {
            name: 'Nombre',
            type: 'Tipo',
            description: 'Descripción',
            capacity: 'Capacidad',
            rackRate: 'Tarifa Base'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
            if (!editingRoom[field as keyof typeof requiredFields]) {
                toast.error(`El campo ${label} es requerido`);
                return;
            }
        }

        // Validación de valores numéricos
        if (editingRoom.capacity < 1) {
            toast.error('La capacidad debe ser mayor a 0');
            return;
        }

        if (editingRoom.rackRate < 0) {
            toast.error('La tarifa base no puede ser negativa');
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const isNewRoom = !editingRoom.id;
            const endpoint = `${apiUrl}/rooms${isNewRoom ? '' : `/${editingRoom.id}`}`;

            console.log('Enviando solicitud a:', endpoint);

            // Preparar datos para enviar
            const roomData = {
                name: editingRoom.name.trim(),
                type: editingRoom.type.trim(),
                description: editingRoom.description.trim(),
                capacity: Number(editingRoom.capacity),
                rackRate: Number(editingRoom.rackRate),
                status: editingRoom.status,
                amenities: Array.isArray(editingRoom.amenities) ?
                    editingRoom.amenities.filter(Boolean).map(a => a.trim()) : [],
                images: Array.isArray(editingRoom.images) ? editingRoom.images : [],
                occupancyRates: Array.isArray(editingRoom.occupancyRates) ?
                    editingRoom.occupancyRates
                        .filter(rate => rate.occupancy > 0 && rate.price >= 0)
                        .map(rate => ({
                            occupancy: Number(rate.occupancy),
                            price: Number(rate.price)
                        })) : [],
                hotelId: process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || ''
            };

            if (editingRoom.offerRate !== undefined && editingRoom.offerRate > 0) {
                roomData.offerRate = Number(editingRoom.offerRate);
            }

            console.log('Datos a enviar:', roomData);

            const response = await fetch(endpoint, {
                method: isNewRoom ? 'POST' : 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(roomData)
            });

            const responseData = await response.json().catch(() => null);
            console.log('Respuesta del servidor:', responseData);

            if (!response.ok) {
                throw new Error(
                    responseData?.message ||
                    `Error del servidor: ${response.status} - ${response.statusText}`
                );
            }

            if (isNewRoom) {
                setRooms([...rooms, responseData]);
                toast.success('Habitación creada correctamente');
            } else {
                setRooms(rooms.map(room =>
                    room.id === responseData.id ? responseData : room
                ));
                toast.success('Habitación actualizada correctamente');
            }

            setIsDialogOpen(false);
            setEditingRoom(null);
        } catch (error) {
            console.error('Error detallado:', error);
            toast.error(error instanceof Error ? error.message : 'Error al guardar los cambios');
        }
    };

    const addFeature = () => {
        if (editingRoom && newFeature.trim()) {
            setEditingRoom({
                ...editingRoom,
                amenities: [...editingRoom.amenities, newFeature.trim()]
            });
            setNewFeature('');
        }
    };

    const removeFeature = (feature: string) => {
        if (editingRoom) {
            setEditingRoom({
                ...editingRoom,
                amenities: editingRoom.amenities.filter(f => f !== feature)
            });
        }
    };

    const getStatusBadge = (status: Room['status']) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-green-500 text-white">Disponible</Badge>
            case 'occupied':
                return <Badge className="bg-yellow-500 text-white">Ocupada</Badge>
            case 'maintenance':
                return <Badge className="bg-red-500 text-white">Mantenimiento</Badge>
        }
    }

    const handleDuplicate = (room: Room) => {
        const duplicatedRoom = {
            ...room,
            id: '',
            name: `${room.name} (Copia)`,
            status: 'available' as const,
            occupancyRates: room.occupancyRates.map(rate => ({
                ...rate,
                id: undefined,
                roomId: undefined
            }))
        };
        setEditingRoom(duplicatedRoom);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Habitaciones</h2>
                    <p className="text-muted-foreground">
                        Gestiona las habitaciones del hotel ({rooms.length} habitaciones)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={createMatrimonialRooms}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Habitaciones Matrimoniales
                    </Button>
                    <Button onClick={createQuadrupleRooms}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Habitaciones Cuádruples
                    </Button>
                    <Button onClick={createFamilyRooms}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Habitaciones Familiares
                    </Button>
                    <Button onClick={() => {
                        setEditingRoom({
                            id: '',
                            name: '',
                            type: '',
                            description: '',
                            capacity: 1,
                            rackRate: 0,
                            offerRate: 0,
                            amenities: [],
                            images: [],
                            status: 'available',
                            occupancyRates: []
                        })
                        setIsDialogOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Habitación
                    </Button>
                </div>
            </div>

            {rooms.length === 0 ? (
                <Card className="p-6">
                    <div className="text-center">
                        <p className="text-muted-foreground">No hay habitaciones registradas</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <Card key={room.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold">{room.name}</h3>
                                    <p className="text-sm text-muted-foreground">{room.type}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDuplicate(room)}
                                        title="Duplicar habitación"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(room)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(room)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Tarifa: ${room.rackRate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Capacidad: {room.capacity}</span>
                                </div>
                                <div>{getStatusBadge(room.status)}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Diálogo de edición */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRoom?.id ? 'Editar Habitación' : 'Nueva Habitación'}
                        </DialogTitle>
                        <DialogDescription>
                            Completa los detalles de la habitación
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={editingRoom?.name || ''}
                                    onChange={(e) => setEditingRoom(prev => prev ? {
                                        ...prev,
                                        name: e.target.value
                                    } : null)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Input
                                    id="type"
                                    value={editingRoom?.type || ''}
                                    onChange={(e) => setEditingRoom(prev => prev ? {
                                        ...prev,
                                        type: e.target.value
                                    } : null)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Input
                                    id="description"
                                    value={editingRoom?.description || ''}
                                    onChange={(e) => setEditingRoom(prev => prev ? {
                                        ...prev,
                                        description: e.target.value
                                    } : null)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="capacity">Capacidad</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min="1"
                                        value={editingRoom?.capacity || 1}
                                        onChange={(e) => {
                                            const capacity = parseInt(e.target.value);
                                            setEditingRoom(prev => {
                                                if (!prev) return null;
                                                // Generar tarifas de ocupación basadas en la capacidad
                                                const occupancyRates = Array.from({ length: capacity }, (_, i) => ({
                                                    occupancy: i + 1,
                                                    price: prev.rackRate || 0,
                                                    ...(prev.occupancyRates?.find(rate => rate.occupancy === i + 1) || {})
                                                }));
                                                return {
                                                    ...prev,
                                                    capacity,
                                                    occupancyRates
                                                };
                                            });
                                        }}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="rackRate">Tarifa Base</Label>
                                    <Input
                                        id="rackRate"
                                        type="number"
                                        min="0"
                                        value={editingRoom?.rackRate || 0}
                                        onChange={(e) => setEditingRoom(prev => prev ? {
                                            ...prev,
                                            rackRate: parseFloat(e.target.value)
                                        } : null)}
                                    />
                                </div>
                            </div>

                            {/* Tarifas por ocupación */}
                            {editingRoom?.capacity > 0 && (
                                <div className="grid gap-2">
                                    <Label>Tarifas por Ocupación</Label>
                                    <div className="grid gap-4 p-4 border rounded-lg">
                                        {Array.from({ length: editingRoom.capacity }, (_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <span className="min-w-[120px]">{i + 1} {i + 1 === 1 ? 'persona' : 'personas'}</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={editingRoom.occupancyRates?.find(rate => rate.occupancy === i + 1)?.price || 0}
                                                    onChange={(e) => setEditingRoom(prev => {
                                                        if (!prev) return null;
                                                        const newRates = [...(prev.occupancyRates || [])];
                                                        const rateIndex = newRates.findIndex(rate => rate.occupancy === i + 1);
                                                        const newRate = {
                                                            occupancy: i + 1,
                                                            price: parseFloat(e.target.value)
                                                        };
                                                        if (rateIndex >= 0) {
                                                            newRates[rateIndex] = newRate;
                                                        } else {
                                                            newRates.push(newRate);
                                                        }
                                                        return {
                                                            ...prev,
                                                            occupancyRates: newRates
                                                        };
                                                    })}
                                                    placeholder={`Tarifa para ${i + 1} ${i + 1 === 1 ? 'persona' : 'personas'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label>Amenidades</Label>
                                <div className="flex flex-wrap gap-2">
                                    {editingRoom?.amenities.map((amenity) => (
                                        <Badge
                                            key={amenity}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => removeFeature(amenity)}
                                        >
                                            {amenity} ×
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Nueva amenidad..."
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addFeature();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={addFeature}>
                                        Agregar
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Estado</Label>
                                <select
                                    id="status"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                    value={editingRoom?.status || 'available'}
                                    onChange={(e) => setEditingRoom(prev => prev ? {
                                        ...prev,
                                        status: e.target.value as Room['status']
                                    } : null)}
                                    aria-label="Estado de la habitación"
                                >
                                    <option value="available">Disponible</option>
                                    <option value="occupied">Ocupada</option>
                                    <option value="maintenance">Mantenimiento</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave}>
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar esta habitación? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 