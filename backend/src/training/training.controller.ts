import { Controller, Get, Post, HttpException, HttpStatus, UseInterceptors, UploadedFile, Logger, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrainingService } from './training.service';
import { ProcessedContent, HotelInfo } from './types';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('training')
export class TrainingController {
  private readonly logger = new Logger(TrainingController.name);
  private readonly uploadDir: string = path.join(process.cwd(), 'uploads', 'training');

  constructor(
    private readonly trainingService: TrainingService,
    private readonly prisma: PrismaService
  ) {
    // Asegurarse de que los directorios existen
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    this.logger.log(`Directorio de uploads creado: ${this.uploadDir}`);
  }

  @Get('processed-content')
  async getProcessedContent(): Promise<ProcessedContent> {
    try {
      this.logger.debug('Solicitando contenido procesado...');
      const content = await this.trainingService.getProcessedContent();
      this.logger.debug('Contenido procesado obtenido correctamente');
      return content;
    } catch (error) {
      this.logger.error('Error al obtener contenido procesado:', error);
      throw new HttpException(
        error.message || 'Error al procesar el archivo de entrenamiento',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const logger = new Logger('TrainingController');
        const uploadPath = path.join(process.cwd(), 'uploads', 'training');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        logger.debug(`Guardando archivo en: ${uploadPath}`);
        cb(null, uploadPath);
      },
      filename: (_req, _file, cb) => {
        const logger = new Logger('TrainingController');
        logger.debug('Nombre del archivo: training_conversations.txt');
        cb(null, 'training_conversations.txt');
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (_req, file, cb) => {
      const logger = new Logger('TrainingController');
      if (file.mimetype !== 'text/plain') {
        logger.error(`Tipo de archivo no válido: ${file.mimetype}`);
        return cb(new Error('Solo se permiten archivos de texto (.txt)'), false);
      }
      logger.debug('Archivo validado correctamente');
      cb(null, true);
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      this.logger.error('No se proporcionó ningún archivo');
      throw new HttpException('No se proporcionó ningún archivo', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.debug('Iniciando procesamiento del archivo...');
      const training = await this.trainingService.uploadFile(file);
      this.logger.debug('Archivo procesado correctamente');
      return {
        message: 'Archivo subido y procesado correctamente',
        training
      };
    } catch (error) {
      this.logger.error('Error al procesar el archivo:', error);
      throw new HttpException(
        error.message || 'Error al procesar el archivo subido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reset')
  async resetTrainingData() {
    try {
      this.logger.debug('Iniciando reinicio de datos de entrenamiento...');
      await this.trainingService.resetTrainingData();
      return {
        message: 'Datos de entrenamiento reiniciados correctamente'
      };
    } catch (error) {
      this.logger.error('Error al reiniciar datos:', error);
      throw new HttpException(
        error.message || 'Error al reiniciar los datos de entrenamiento',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('update-info')
  async updateHotelInfo(@Body() updateDto: { hotelInfo: HotelInfo }) {
    try {
      this.logger.debug('Actualizando información del hotel...', updateDto);
      
      // Buscar registro existente
      const existingTraining = await this.prisma.training.findFirst();
      
      if (!existingTraining) {
        this.logger.error('No se encontró el registro de entrenamiento');
        throw new HttpException('No se encontró el registro de entrenamiento', HttpStatus.NOT_FOUND);
      }

      // Obtener el contenido actual y validar su estructura
      const currentContent = existingTraining.processedContent as unknown as ProcessedContent;
      
      if (!currentContent || !currentContent.conversations || !currentContent.extractedInfo) {
        this.logger.error('El contenido actual no tiene el formato esperado');
        throw new HttpException('El contenido actual no tiene el formato esperado', HttpStatus.BAD_REQUEST);
      }
      
      // Validar la estructura del hotelInfo recibido
      if (!updateDto.hotelInfo || 
          !Array.isArray(updateDto.hotelInfo.amenities) ||
          !Array.isArray(updateDto.hotelInfo.policies) ||
          !Array.isArray(updateDto.hotelInfo.roomTypes) ||
          !Array.isArray(updateDto.hotelInfo.services)) {
        this.logger.error('Estructura de hotelInfo inválida', updateDto);
        throw new HttpException('Estructura de información inválida', HttpStatus.BAD_REQUEST);
      }
      
      // Crear el contenido actualizado
      const updatedContent: ProcessedContent = {
        ...currentContent,
        extractedInfo: {
          ...currentContent.extractedInfo,
          hotelInfo: {
            amenities: [...updateDto.hotelInfo.amenities],
            policies: [...updateDto.hotelInfo.policies],
            roomTypes: [...updateDto.hotelInfo.roomTypes],
            services: [...updateDto.hotelInfo.services]
          }
        }
      };

      // Actualizar el registro en la base de datos
      const updated = await this.prisma.training.update({
        where: { id: existingTraining.id },
        data: {
          processedContent: updatedContent as unknown as Prisma.JsonValue
        }
      });

      this.logger.debug('Información del hotel actualizada correctamente', {
        id: updated.id,
        amenities: updatedContent.extractedInfo.hotelInfo.amenities.length,
        policies: updatedContent.extractedInfo.hotelInfo.policies.length,
        roomTypes: updatedContent.extractedInfo.hotelInfo.roomTypes.length,
        services: updatedContent.extractedInfo.hotelInfo.services.length
      });

      return { 
        message: 'Información actualizada correctamente',
        hotelInfo: updatedContent.extractedInfo.hotelInfo
      };
    } catch (error) {
      this.logger.error('Error al actualizar información:', error);
      throw new HttpException(
        error.message || 'Error al actualizar la información',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 