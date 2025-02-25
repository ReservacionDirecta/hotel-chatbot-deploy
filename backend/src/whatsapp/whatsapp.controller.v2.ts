import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Param, HttpException, HttpStatus } from '@nestjs/common';
import { WhatsappServiceV2 } from './whatsapp.service.v2';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('whatsapp/v2')
export class WhatsappControllerV2 {
  constructor(private readonly whatsappService: WhatsappServiceV2) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Get('qr')
  getQR() {
    return this.whatsappService.getQR();
  }

  @Get('conversations')
  getConversations() {
    return this.whatsappService.getConversations();
  }

  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    try {
        console.log('Recibiendo solicitud de envío de mensaje:', body);
        if (!body.to || !body.message) {
            throw new Error('Se requiere número de teléfono y mensaje');
        }

        const result = await this.whatsappService.sendMessage(body.to, body.message);
        console.log('Mensaje enviado exitosamente:', result);
        return result;
    } catch (error) {
        console.error('Error en el controlador al enviar mensaje:', error);
        throw new HttpException(
            {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message,
                details: error.stack
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }

  @Post('send-media')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: {
      fileSize: 16 * 1024 * 1024, // 16MB
    },
  }))
  async sendMedia(
    @UploadedFile() file: MulterFile,
    @Body('to') to: string,
    @Body('caption') caption?: string,
  ) {
    try {
      if (!file) {
        throw new Error('No se ha proporcionado ningún archivo');
      }
      if (!to) {
        throw new Error('No se ha proporcionado el número de teléfono');
      }

      return await this.whatsappService.sendMedia(to, file, caption);
    } catch (error) {
      console.error('Error al enviar archivo:', error);
      throw error;
    }
  }

  @Post('send-location')
  async sendLocation(
    @Body() body: { 
      to: string; 
      latitude: number; 
      longitude: number;
      description?: string;
    }
  ) {
    const { to, latitude, longitude, description } = body;
    return this.whatsappService.sendLocation(to, latitude, longitude, description);
  }

  @Get('media/:messageId')
  async getMedia(@Param('messageId') messageId: string) {
    return this.whatsappService.downloadMedia(messageId);
  }

  @Post('react')
  async reactToMessage(@Body() body: { messageId: string; reaction: string }) {
    const { messageId, reaction } = body;
    return this.whatsappService.reactToMessage(messageId, reaction);
  }

  @Post('logout')
  logout() {
    return this.whatsappService.logout();
  }
} 