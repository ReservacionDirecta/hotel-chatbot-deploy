export interface OccupancyRate {
    occupancy: number;
    price: number;
}

export interface Room {
    id: string;
    name: string;
    type: string;
    description: string;
    capacity: number;
    rackRate: number;
    offerRate?: number;
    amenities: string[] | string;
    images: string[] | string;
    status: string;
    hotelId: string;
    createdAt: Date;
    updatedAt: Date;
    occupancyRates: Array<{
        occupancy: number;
        price: number;
    }>;
}

export interface Script {
    id: string;
    name: string;
    description?: string;
    triggers: string[] | string;
    response: string;
    active: boolean;
    category: 'reservation' | 'pricing' | 'information' | 'complaint' | string;
    requiresDate?: boolean;
    requiresRoomType?: boolean;
    requiresOccupancy?: boolean;
    createdAt: Date;
    updatedAt: Date;
} 