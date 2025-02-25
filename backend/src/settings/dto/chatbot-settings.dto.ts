import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, Length, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatbotSettingsDto {
  @ApiProperty({ description: 'Nombre del chatbot', example: 'Hotel Assistant' })
  @IsString()
  @Length(3, 50, { message: 'El nombre debe tener entre 3 y 50 caracteres' })
  botName: string = '';

  @ApiProperty({ description: 'Mensaje de bienvenida del chatbot', example: '¡Bienvenido al Hotel Cascade!' })
  @IsString()
  @Length(10, 200, { message: 'El mensaje de bienvenida debe tener entre 10 y 200 caracteres' })
  welcomeMessage: string = '';

  @ApiProperty({ description: 'Idioma del chatbot', example: 'es', enum: ['es', 'en'] })
  @IsString()
  @IsIn(['es', 'en'], { message: 'El idioma debe ser "es" o "en"' })
  language: string = 'es';

  @ApiProperty({ description: 'Personalidad del chatbot', example: 'profesional', enum: ['profesional', 'amigable', 'formal', 'casual'] })
  @IsString()
  @IsIn(['profesional', 'amigable', 'formal', 'casual'], { message: 'La personalidad debe ser "profesional", "amigable", "formal" o "casual"' })
  personality: string = 'profesional';

  @ApiProperty({ description: 'Tiempo de respuesta en segundos', minimum: 0.5, maximum: 5 })
  @IsNumber()
  @Min(0.5, { message: 'El tiempo de respuesta mínimo es 0.5 segundos' })
  @Max(5, { message: 'El tiempo de respuesta máximo es 5 segundos' })
  responseTime: number = 1;

  @ApiProperty({ description: 'Indica si el chatbot está activo' })
  @IsBoolean()
  isActive: boolean = true;

  @ApiProperty({ description: 'Indica si el chatbot responde automáticamente' })
  @IsBoolean()
  autoResponse: boolean = true;

  @ApiProperty({ description: 'Longitud máxima de la conversación en mensajes', minimum: 10, maximum: 100 })
  @IsNumber()
  @Min(10, { message: 'La longitud mínima de conversación es 10 mensajes' })
  @Max(100, { message: 'La longitud máxima de conversación es 100 mensajes' })
  maxConversationLength: number = 50;

  @ApiProperty({ description: 'Tipo de cambio del día (USD a PEN)', example: '3.70' })
  @IsString()
  @Length(1, 10, { message: 'El tipo de cambio debe tener entre 1 y 10 caracteres' })
  exchangeRate: string = '3.70';

  @ApiProperty({ description: 'Instrucciones personalizadas para el chatbot' })
  @IsString()
  @Length(10, 2000, { message: 'Las instrucciones deben tener entre 10 y 2000 caracteres' })
  customInstructions: string = `Eres un asistente virtual del Hotel Cascade. Cuando menciones precios de habitaciones, debes hacer la conversión de dólares a soles usando el tipo de cambio del día. 
Por ejemplo, si una habitación cuesta $100 USD y el tipo de cambio es 3.70, deberás indicar: "La habitación cuesta $100 USD (S/. 370 soles)".
Siempre muestra ambos precios: en dólares y en soles.`;
} 