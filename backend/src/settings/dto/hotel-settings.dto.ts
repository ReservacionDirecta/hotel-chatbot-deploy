import { IsString, IsOptional, IsEmail } from 'class-validator';

export class HotelSettingsDto {
  @IsString()
  name: string = '';

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  description?: string;
} 