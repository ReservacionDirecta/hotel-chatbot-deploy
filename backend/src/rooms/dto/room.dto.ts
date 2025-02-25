import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class OccupancyRateDto {
  @IsNumber()
  @Min(1)
  @Max(10)
  occupancy!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  capacity!: number;

  @IsNumber()
  @Min(0)
  rackRate!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offerRate?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  amenities!: string[];

  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OccupancyRateDto)
  occupancyRates!: OccupancyRateDto[];
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  capacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rackRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offerRate?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OccupancyRateDto)
  @IsOptional()
  occupancyRates?: OccupancyRateDto[];
} 