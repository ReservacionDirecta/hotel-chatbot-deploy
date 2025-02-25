// Interfaces básicas
export interface RoomInfo {
    minPrice: number;
    maxPrice: number;
    capacity: number;
}

export interface RoomGrouped {
    [key: string]: RoomInfo;
}

export interface Room {
    id: string;
    name: string;
    type: string;
    description: string;
    capacity: number;
    status: string;
    rackRate: number;
    amenities: any;
    images: any;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaces de scripts y configuración
export interface Script {
    id: number;
    name: string;
    description: string;
    active: boolean;
    triggers: string;  // JSON string array
    response: string;
    category?: string;
    requiresDate: boolean;
    requiresRoomType: boolean;
    requiresOccupancy: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateScriptDto {
    name: string;
    description: string;
    active?: boolean;
    triggers: string[];
    response: string;
    category?: string;
    requiresDate?: boolean;
    requiresRoomType?: boolean;
    requiresOccupancy?: boolean;
}

export interface UpdateScriptDto {
    name?: string;
    description?: string;
    active?: boolean;
    triggers?: string[];
    response?: string;
    category?: string;
    requiresDate?: boolean;
    requiresRoomType?: boolean;
    requiresOccupancy?: boolean;
}

export interface ScriptContent {
    triggers: string[];
    response: string;
    category?: string;
    requiresDate?: boolean;
    requiresRoomType?: boolean;
    requiresOccupancy?: boolean;
}

export interface AIConfig {
    id: number;
    provider: string;
    apiKey: string;
    baseURL: string;
    model: string;
    exchangeRate: string;
    customInstructions: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaces de tarifas y habitaciones
export interface OccupancyRate {
    id: string;
    roomId: string;
    occupancy: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface RoomWithRates extends Room {
    rates: {
        rackRate: number;
        offerRate?: number;
    };
    status: string;
}

// Interfaces de respuesta
export interface ChatResponse {
    success: boolean;
    response: string;
}

// Interfaces de entrenamiento
export type TrainingStatusType = 'pending' | 'processing' | 'completed' | 'error';

export interface TrainingStatus {
    id: string;
    status: TrainingStatusType;
    progress: number;
    error?: string;
}

export interface Training extends TrainingStatus {
    fileName: string;
    originalName: string;
    filePath: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

export interface ProcessedTraining {
    id: string;
    filename: string;
    filepath: string;
    status: string;
    progress: number;
    error?: string | null;
    processedContent?: any | null;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaces de booking
export interface Guest {
    type: 'adult' | 'child';
    age?: number;
}

export interface BookingQuery {
    guests: Guest[];
    dates?: {
        checkIn: Date;
        checkOut: Date;
    };
    roomType?: string;
    payingGuests?: number;
}

export interface AIResponse {
    success: boolean;
    response: string;
    source: 'script' | 'ai' | 'fallback_script' | 'error_handler';
}