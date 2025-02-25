import { Controller, Post, Get, Body, Param, UseGuards, UseInterceptors, UploadedFile, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ChatRequest {
    prompt: string;
}

interface AIConfigDto {
    provider: string;
    apiKey: string;
    baseURL: string;
    model: string;
    exchangeRate: string;
    customInstructions: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
    constructor(private readonly aiService: AIService) {}

    @Post('chat')
    async chat(@Body() body: ChatRequest) {
        try {
            return await this.aiService.chat(body.prompt);
        } catch (error) {
            console.error('Error in chat:', error);
            throw new HttpException(
                error.response?.message || 'Error al procesar el mensaje',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('training/upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/training',
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            const validMimeTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/csv',
                'text/plain'
            ];
            
            if (!validMimeTypes.includes(file.mimetype)) {
                return cb(
                    new HttpException(
                        'Tipo de archivo no válido. Solo se permiten archivos CSV.',
                        HttpStatus.BAD_REQUEST
                    ),
                    false
                );
            }
            cb(null, true);
        },
    }))
    async uploadTrainingFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('No se proporcionó ningún archivo', HttpStatus.BAD_REQUEST);
        }

        try {
            return await this.aiService.uploadTrainingFile(file);
        } catch (error) {
            console.error('Error uploading training file:', error);
            throw new HttpException(
                error.response?.message || 'Error al subir el archivo de entrenamiento',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('training')
    async getAllTrainings() {
        try {
            const trainings = await this.aiService.getAllTrainings();
            return trainings;
        } catch (error) {
            console.error('Error in getAllTrainings:', error);
            throw new HttpException(
                error.response?.message || 'Error al obtener los entrenamientos',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('training/:id/status')
    async getTrainingStatus(@Param('id') id: string) {
        try {
            return await this.aiService.getTrainingStatus(id);
        } catch (error) {
            console.error('Error getting training status:', error);
            throw new HttpException(
                error.response?.message || 'Error al obtener el estado del entrenamiento',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('training/:id/start')
    async startTraining(@Param('id') id: string) {
        return this.aiService.startTraining(id);
    }

    @Get('config')
    async getConfig() {
        return this.aiService.getConfig();
    }

    @Post('config')
    async updateConfig(@Body() config: AIConfigDto) {
        // Validar que todos los campos requeridos estén presentes
        if (!config.provider || !config.baseURL || 
            !config.model || !config.exchangeRate || !config.customInstructions) {
            throw new BadRequestException('Todos los campos son requeridos');
        }

        // Validar el tipo de cambio
        const exchangeRate = parseFloat(config.exchangeRate);
        if (isNaN(exchangeRate) || exchangeRate <= 0) {
            throw new BadRequestException('El tipo de cambio debe ser un número positivo');
        }

        // Validar el proveedor
        if (!['glhf', 'kluster'].includes(config.provider)) {
            throw new BadRequestException('Proveedor no válido');
        }

        // Validar la API key para proveedores que no son Kluster
        if (!config.apiKey && config.provider !== 'kluster') {
            throw new BadRequestException('La API key es requerida para este proveedor');
        }

        try {
            return await this.aiService.updateConfig(config);
        } catch (error) {
            if (error.message.includes('API Key inválida')) {
                throw new BadRequestException('La API key proporcionada no es válida');
            }
            throw error;
        }
    }

    @Get('providers')
    getProviders() {
        return {
            providers: [
                {
                    id: 'glhf',
                    name: 'GLHF (Compatible con OpenAI)',
                    baseURL: 'https://glhf.chat/api/openai/v1',
                    models: ['gpt-3.5-turbo', 'gpt-4']
                },
                {
                    id: 'kluster',
                    name: 'Kluster AI',
                    baseURL: 'https://api.kluster.ai/v1',
                    models: [
                        'klusterai/Meta-Llama-3.1-8B-Instruct-Turbo',
                        'klusterai/Meta-Llama-3.1-405B-Instruct-Turbo',
                        'klusterai/Meta-Llama-3.3-70B-Instruct-Turbo',
                        'deepseek-ai/DeepSeek-R1'
                    ]
                }
            ]
        };
    }

    @Get('training/:id/content')
    async getTrainingContent(@Param('id') id: string) {
        return this.aiService.getTrainingContent(id);
    }

    @Get('debug/rooms')
    @UseGuards(JwtAuthGuard)
    async debugRooms() {
        try {
            return await this.aiService.logRoomsAndRates();
        } catch (error) {
            throw new HttpException(
                'Error al obtener las habitaciones',
                HttpStatus.INTERNAL_SERVER_ERROR,
                { cause: error }
            );
        }
    }
}