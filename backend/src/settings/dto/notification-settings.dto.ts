import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationSettingsDto {
  @ApiProperty({ description: 'Habilitar notificaciones por email' })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'Habilitar notificaciones por WhatsApp' })
  @IsBoolean()
  @IsOptional()
  phoneEnabled?: boolean;

  @ApiProperty({ description: 'Habilitar notificaciones push' })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiProperty({ description: 'Notificar cuando hay una nueva reserva' })
  @IsBoolean()
  @IsOptional()
  notifyOnBooking?: boolean;

  @ApiProperty({ description: 'Notificar cuando hay un check-in' })
  @IsBoolean()
  @IsOptional()
  notifyOnCheckIn?: boolean;

  @ApiProperty({ description: 'Notificar cuando hay un check-out' })
  @IsBoolean()
  @IsOptional()
  notifyOnCheckOut?: boolean;

  @ApiProperty({ description: 'Notificar cuando hay un nuevo mensaje' })
  @IsBoolean()
  @IsOptional()
  notifyOnMessage?: boolean;
} 