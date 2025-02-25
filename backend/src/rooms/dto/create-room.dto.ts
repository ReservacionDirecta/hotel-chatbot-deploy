import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OccupancyRateDto {
    @IsNumber()
    price: number;

    @IsNumber()
    @IsOptional()
    occupancy?: number;
}

export class CreateRoomDto {
    @IsString()
    name: string;

    @IsString()
    type: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    capacity?: number;

    @IsNumber()
    rackRate: number;

    @IsNumber()
    @IsOptional()
    offerRate?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    amenities?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    hotelId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OccupancyRateDto)
    @IsOptional()
    occupancyRates?: OccupancyRateDto[];
}
