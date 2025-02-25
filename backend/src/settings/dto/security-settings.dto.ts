import { IsBoolean, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class SecuritySettingsDto {
  @IsBoolean()
  @IsOptional()
  twoFactorAuth?: boolean;

  @IsNumber()
  @Min(30)
  @Max(365)
  @IsOptional()
  passwordExpiration?: number;

  @IsNumber()
  @Min(5)
  @Max(120)
  @IsOptional()
  sessionTimeout?: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxLoginAttempts?: number;

  @IsString()
  @IsOptional()
  ipWhitelist?: string;

  @IsString()
  @IsOptional()
  securityLevel?: string;

  @IsBoolean()
  @IsOptional()
  autoLogout?: boolean;

  @IsString()
  @IsOptional()
  passwordComplexity?: string;
} 