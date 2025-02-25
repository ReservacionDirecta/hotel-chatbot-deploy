import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { ProcessedContent, CommonQuestion, HotelInfo } from './types';
import { Prisma } from '@prisma/client';

@Injectable()
export class TrainingService {
  private readonly logger = new Logger(TrainingService.name);

  constructor(private prisma: PrismaService) {}

  async getProcessedContent(): Promise<ProcessedContent> {
    try {
      this.logger.debug('Obteniendo contenido procesado desde la base de datos...');
      
      // Buscar el registro en la base de datos
      const training = await this.prisma.training.findFirst();
      
      if (!training) {
        this.logger.error('No se encontró registro de entrenamiento');
        throw new Error('Archivo de entrenamiento no encontrado');
      }

      // Verificar que el contenido procesado existe y tiene el formato correcto
      const processedContent = training.processedContent as unknown as ProcessedContent;
      
      if (!processedContent || !processedContent.conversations || !processedContent.extractedInfo) {
        this.logger.error('El contenido procesado no tiene el formato esperado');
        throw new Error('El contenido procesado no tiene el formato esperado');
      }

      this.logger.debug(`Contenido procesado obtenido correctamente. Conversaciones: ${processedContent.conversations.length}`);
      
      return processedContent;
      
    } catch (error) {
      this.logger.error('Error al obtener contenido procesado:', error);
      throw new Error(`Error al obtener el contenido procesado: ${error.message}`);
    }
  }

  private extractCommonQuestions(conversations: any[]): CommonQuestion[] {
    const commonQuestions: CommonQuestion[] = [];
    const questionMap = new Map<string, { question: string; answers: string[]; frequency: number }>();

    conversations.forEach(conv => {
      let currentQuestion = '';
      
      conv.messages.forEach((msg: any, idx: number) => {
        if (msg.role === 'user') {
          currentQuestion = msg.content.toLowerCase();
        } else if (msg.role === 'assistant' && currentQuestion) {
          // Analizar la pregunta para categorizarla
          const category = this.categorizeQuestion(currentQuestion);
          if (category) {
            const key = category.question;
            const existing = questionMap.get(key);
            
            if (existing) {
              existing.frequency++;
              existing.answers.push(msg.content);
            } else {
              questionMap.set(key, {
                question: category.question,
                answers: [msg.content],
                frequency: 1
              });
            }
          }
          currentQuestion = '';
        }
      });
    });

    // Convertir el mapa a array y seleccionar la mejor respuesta para cada pregunta
    questionMap.forEach((value, key) => {
      commonQuestions.push({
        question: key,
        answer: this.selectBestAnswer(value.answers),
        frequency: value.frequency,
        examples: value.answers.slice(0, 3) // Guardar hasta 3 ejemplos de respuestas
      });
    });

    return commonQuestions.sort((a, b) => b.frequency - a.frequency);
  }

  private categorizeQuestion(question: string): { question: string } | null {
    const categories = [
      {
        patterns: [/(precio|costo|tarifa|cuanto cuesta)/i],
        question: '¿Cuál es el precio de las habitaciones?'
      },
      {
        patterns: [/(disponibilidad|hay lugar|tienen fechas|hay espacio)/i],
        question: '¿Tienen disponibilidad para estas fechas?'
      },
      {
        patterns: [/(forma.*pago|método.*pago|como.*pagar|aceptan.*tarjeta)/i],
        question: '¿Qué formas de pago aceptan?'
      },
      {
        patterns: [/(cancelar|cancelación|devolución|reembolso)/i],
        question: '¿Cuál es la política de cancelación?'
      },
      {
        patterns: [/(check.*in|check.*out|hora.*entrada|hora.*salida)/i],
        question: '¿Cuáles son los horarios de check-in y check-out?'
      },
      {
        patterns: [/(servicio|incluye|amenidade|facilidade)/i],
        question: '¿Qué servicios incluye la habitación?'
      },
      {
        patterns: [/(ubicacion|direccion|como llegar|donde estan)/i],
        question: '¿Dónde están ubicados?'
      },
      {
        patterns: [/(estacionamiento|parking|parqueo)/i],
        question: '¿Tienen estacionamiento?'
      },
      {
        patterns: [/(wifi|internet|conexion)/i],
        question: '¿Tienen WiFi?'
      },
      {
        patterns: [/(mascota|perro|gato)/i],
        question: '¿Aceptan mascotas?'
      }
    ];

    for (const category of categories) {
      if (category.patterns && category.patterns.some(pattern => pattern.test(question))) {
        return { question: category.question };
      }
    }

    return null;
  }

  private selectBestAnswer(answers: string[]): string {
    // Seleccionar la respuesta más completa y concisa
    return answers.reduce((best, current) => {
      // Preferir respuestas entre 50 y 200 caracteres
      const bestLength = best.length;
      const currentLength = current.length;
      
      if (currentLength >= 50 && currentLength <= 200 && (bestLength < 50 || bestLength > 200)) {
        return current;
      }
      
      // Si ambas están en el rango ideal, preferir la más corta
      if (currentLength >= 50 && currentLength <= 200 && bestLength >= 50 && bestLength <= 200) {
        return currentLength < bestLength ? current : best;
      }
      
      return best;
    }, answers[0]);
  }

  private extractHotelInfo(conversations: any[]): HotelInfo {
    const info = {
      amenities: [] as string[],
      policies: [] as string[],
      roomTypes: [] as string[],
      services: [] as string[]
    };

    // Patrones para identificar información
    const patterns = {
      amenities: [
        { pattern: /(piscina|alberca)/i, text: 'Piscina' },
        { pattern: /(wifi|internet)/i, text: 'WiFi gratuito' },
        { pattern: /(gimnasio|gym)/i, text: 'Gimnasio' },
        { pattern: /(restaurante)/i, text: 'Restaurante' },
        { pattern: /(bar|lounge)/i, text: 'Bar/Lounge' },
        { pattern: /(estacionamiento|parking)/i, text: 'Estacionamiento gratuito' },
        { pattern: /(spa)/i, text: 'Spa y centro de bienestar' },
        { pattern: /(jardín|jardin)/i, text: 'Jardines' },
        { pattern: /(terraza)/i, text: 'Terraza' },
        { pattern: /(aire.*acondicionado)/i, text: 'Aire acondicionado' }
      ],
      policies: [
        { pattern: /(check.*in|entrada).*(\d{1,2}:\d{2})/i, text: 'Check-in: $2' },
        { pattern: /(check.*out|salida).*(\d{1,2}:\d{2})/i, text: 'Check-out: $2' },
        { pattern: /(mascota|perro|gato)/i, text: 'Política de mascotas disponible' },
        { pattern: /(pago|depósito|deposito)/i, text: 'Se requiere depósito de garantía' },
        { pattern: /(cancelación|cancelacion)/i, text: 'Política de cancelación flexible' },
        { pattern: /(fumar|smoking)/i, text: 'Habitaciones para no fumadores' },
        { pattern: /(igv|impuesto)/i, text: 'Exención de IGV para extranjeros no residentes' }
      ],
      roomTypes: [
        { pattern: /(standard|estándar|estandar)/i, text: 'Habitación Estándar' },
        { pattern: /(suite)/i, text: 'Suite' },
        { pattern: /(deluxe|delux)/i, text: 'Habitación Deluxe' },
        { pattern: /(vista.*mar)/i, text: 'Habitación con Vista al Mar' },
        { pattern: /(familiar)/i, text: 'Habitación Familiar' },
        { pattern: /(ejecutiva)/i, text: 'Habitación Ejecutiva' },
        { pattern: /(bungalow)/i, text: 'Bungalow' }
      ],
      services: [
        { pattern: /(desayuno.*incluido|breakfast)/i, text: 'Desayuno incluido' },
        { pattern: /(limpieza|housekeeping)/i, text: 'Servicio de limpieza diario' },
        { pattern: /(servicio.*habitación|room.*service)/i, text: 'Servicio a la habitación' },
        { pattern: /(lavandería|lavanderia)/i, text: 'Servicio de lavandería' },
        { pattern: /(recepción|recepcion).*24/i, text: 'Recepción 24/7' },
        { pattern: /(conserje|concierge)/i, text: 'Servicio de conserjería' },
        { pattern: /(traslado|shuttle)/i, text: 'Servicio de traslado' },
        { pattern: /(tour|excursion)/i, text: 'Servicio de tours y excursiones' },
        { pattern: /(chilcano|pisco)/i, text: 'Chilcano de pisco de cortesía' },
        { pattern: /(caja.*fuerte|seguridad)/i, text: 'Caja fuerte' }
      ]
    };

    conversations.forEach(conv => {
      const allContent = conv.messages.map((m: any) => m.content).join(' ');
      
      // Procesar cada categoría
      Object.entries(patterns).forEach(([category, categoryPatterns]) => {
        categoryPatterns.forEach(({ pattern, text }) => {
          const match = allContent.match(pattern);
          if (match) {
            let value = text;
            // Reemplazar valores capturados si existen
            if (match.length > 2) {
              value = text.replace('$2', match[2]);
            }
            if (!info[category].includes(value)) {
              info[category].push(value);
            }
          }
        });
      });
    });

    // Retornar arrays con valores por defecto si están vacíos
    return {
      amenities: info.amenities.length > 0 
        ? info.amenities 
        : [
          'WiFi gratuito',
          'Piscina',
          'Estacionamiento gratuito',
          'Aire acondicionado',
          'Restaurante'
        ],
      policies: info.policies.length > 0
        ? info.policies
        : [
          'Check-in: 3:00 PM',
          'Check-out: 12:00 PM',
          'Se requiere depósito de garantía',
          'Política de cancelación flexible',
          'Exención de IGV para extranjeros no residentes'
        ],
      roomTypes: info.roomTypes.length > 0
        ? info.roomTypes
        : [
          'Habitación Estándar',
          'Habitación con Vista al Mar',
          'Suite',
          'Bungalow'
        ],
      services: info.services.length > 0
        ? info.services
        : [
          'Desayuno incluido',
          'Servicio a la habitación',
          'Recepción 24/7',
          'Servicio de limpieza diario',
          'Servicio de traslado',
          'Chilcano de pisco de cortesía'
        ]
    };
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      this.logger.debug('Iniciando proceso de carga de archivo...');
      
      // Asegurarnos de que el directorio existe
      const uploadDir = path.join(process.cwd(), 'uploads', 'training');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Copiar el archivo al directorio de entrenamiento
      const targetPath = path.join(uploadDir, 'training_conversations.txt');
      fs.copyFileSync(file.path, targetPath);
      
      this.logger.debug('Archivo copiado a:', targetPath);

      // Leer y procesar el contenido del archivo
      const content = fs.readFileSync(targetPath, 'utf-8');
      const processedContent = await this.processFileContent(content);

      // Buscar registro existente
      const existingTraining = await this.prisma.training.findFirst();

      // Actualizar o crear registro en la base de datos
      const training = existingTraining 
        ? await this.prisma.training.update({
            where: { id: existingTraining.id },
            data: {
              filename: 'training_conversations.txt',
              filepath: targetPath,
              status: 'completed',
              progress: 100,
              processedContent: processedContent as unknown as Prisma.JsonValue
            }
          })
        : await this.prisma.training.create({
            data: {
              filename: 'training_conversations.txt',
              filepath: targetPath,
              status: 'completed',
              progress: 100,
              processedContent: processedContent as unknown as Prisma.JsonValue
            }
          });

      return training;
    } catch (error) {
      this.logger.error('Error al procesar el archivo:', error);
      throw new Error(`Error al procesar el archivo de entrenamiento: ${error.message}`);
    }
  }

  private async processFileContent(content: string): Promise<ProcessedContent> {
    try {
      const conversations = [];
      const lines = content.split('\n');
      let currentConversation = null;
      let currentMessages = [];

      this.logger.debug(`Iniciando procesamiento de ${lines.length} líneas`);

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Detectar separador de conversaciones
        if (trimmedLine === '---') {
          if (currentConversation && currentMessages.length > 0) {
            conversations.push({
              ...currentConversation,
              messages: [...currentMessages]
            });
          }
          currentConversation = null;
          currentMessages = [];
          continue;
        }

        // Si no hay conversación activa, crear una nueva
        if (!currentConversation) {
          currentConversation = {
            summary: `Conversación ${conversations.length + 1}`,
            tags: [],
            messages: []
          };
        }

        // Detectar y procesar mensajes
        const userMatch = trimmedLine.match(/^Usuario:\s*(.+)/i);
        const assistantMatch = trimmedLine.match(/^Asistente:\s*(.+)/i);
        
        if (userMatch) {
          const content = userMatch[1].trim();
          if (content) {
            currentMessages.push({
              role: 'user',
              content
            });
          }
        } else if (assistantMatch) {
          const content = assistantMatch[1].trim();
          if (content) {
            currentMessages.push({
              role: 'assistant',
              content
            });
          }
        }
      }

      // Guardar la última conversación si existe
      if (currentConversation && currentMessages.length > 0) {
        conversations.push({
          ...currentConversation,
          messages: [...currentMessages]
        });
      }

      // Filtrar conversaciones sin mensajes
      const validConversations = conversations.filter(conv => conv.messages.length > 0);

      const processedContent = {
        conversations: validConversations,
        extractedInfo: {
          commonQuestions: this.extractCommonQuestions(validConversations),
          hotelInfo: this.extractHotelInfo(validConversations)
        }
      };

      return processedContent;
    } catch (error) {
      this.logger.error('Error al procesar el contenido del archivo:', error);
      throw error;
    }
  }

  private isValidProcessedContent(content: any): content is ProcessedContent {
    return (
      content &&
      Array.isArray(content.conversations) &&
      content.extractedInfo &&
      Array.isArray(content.extractedInfo.commonQuestions) &&
      content.extractedInfo.hotelInfo
    );
  }

  async resetTrainingData() {
    try {
      this.logger.debug('Eliminando datos de entrenamiento existentes...');
      
      // Eliminar registros de la base de datos
      await this.prisma.training.deleteMany();
      
      // Eliminar archivo de entrenamiento
      const filePath = path.join(process.cwd(), 'uploads', 'training', 'training_conversations.txt');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      this.logger.debug('Datos de entrenamiento eliminados correctamente');
      return true;
    } catch (error) {
      this.logger.error('Error al reiniciar datos:', error);
      throw new Error(`Error al reiniciar los datos de entrenamiento: ${error.message}`);
    }
  }
} 