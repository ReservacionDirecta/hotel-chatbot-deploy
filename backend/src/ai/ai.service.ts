import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScriptsService } from '../scripts/scripts.service';
import { RoomsService } from '../rooms/rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { Script, AIConfig, Room, Training } from '@prisma/client';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import NodeCache = require('node-cache');
import {
    Guest,
    BookingQuery,
    RoomWithRates,
    AIResponse,
    ProcessedTraining
} from '../types/interfaces';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AIService {
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'training');
    private openai: OpenAI;
    private lastBookingQuery: any = null;
    private readonly cache: NodeCache;
    private conversationContext: Map<string, any[]> = new Map();
    private config: {
        model: string;
        baseURL: string;
        exchangeRate: string;
        customInstructions: string;
        maxTokens: number;
        temperature: number;
        presencePenalty: number;
        frequencyPenalty: number;
        contextWindow: number;
    };

    constructor(
        private configService: ConfigService,
        private readonly scriptsService: ScriptsService,
        private readonly prisma: PrismaService,
        private readonly roomsService: RoomsService
    ) {
        this.ensureUploadsDir();
        this.initializeAI();
        this.cache = new NodeCache({ 
            stdTTL: 300,  // 5 minutos
            checkperiod: 60,  // Revisar caducidad cada minuto
            useClones: false  // No clonar objetos para mejor rendimiento
        });
    }

    private async ensureUploadsDir() {
        try {
            const uploadDir = path.join(process.cwd(), 'uploads');
            const trainingDir = path.join(uploadDir, 'training');

            // Crear directorios si no existen
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.mkdir(trainingDir, { recursive: true });

            console.log('Upload directories created:', {
                uploadDir,
                trainingDir
            });
        } catch (error) {
            console.error('Error creating upload directories:', error);
            throw new HttpException(
                'Error al crear directorios de carga',
                HttpStatus.INTERNAL_SERVER_ERROR,
                { cause: error }
            );
        }
    }

    async uploadTrainingFile(file: Express.Multer.File) {
        try {
            await this.ensureUploadsDir();

            console.log('Uploading training file:', {
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            });

            // Crear el registro en la base de datos
            const training = await this.prisma.training.create({
                data: {
                    filename: file.originalname,
                    filepath: file.path,
                    status: 'pending',
                    progress: 0
                }
            });

            console.log('Training record created:', training);

            // Procesar el archivo de manera asíncrona
            this.processTrainingFile(training.filepath).catch(error => {
                console.error('Error processing training file:', error);
            });

            return training;
        } catch (error) {
            console.error('Error uploading training file:', error);
            throw new HttpException(
                'Error al subir el archivo de entrenamiento',
                HttpStatus.INTERNAL_SERVER_ERROR,
                { cause: error }
            );
        }
    }

    async processTrainingFile(filePath: string): Promise<any> {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            
            // Verificar si es un archivo CSV
            if (filePath.endsWith('.csv')) {
                return this.processCSVContent(fileContent);
            }
            
            // Procesar formato de texto plano
            return {
                conversations: this.extractConversations(fileContent),
                extractedInfo: this.extractHotelInfo(fileContent)
            };
        } catch (error) {
            console.error('Error procesando archivo de entrenamiento:', error);
            throw error;
        }
    }

    private processCSVContent(content: string): any {
        try {
            // Dividir el contenido en líneas y remover comillas
            const lines = content.split('\n').map(line => line.trim());
            const headers = lines[0].split(',');
            
            // Inicializar variables para procesar las conversaciones
            const conversations = new Map<string, any>();
            let currentConversation: any = null;
            
            // Procesar cada línea del CSV (excepto el encabezado)
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                // Parsear la línea CSV considerando las comillas
                const values = this.parseCSVLine(lines[i]);
                const [role, content, conversationId, timestamp] = values;
                
                if (!conversations.has(conversationId)) {
                    conversations.set(conversationId, {
                        id: conversationId,
                        messages: [],
                        tags: new Set<string>()
                    });
                }
                
                currentConversation = conversations.get(conversationId);
                
                // Agregar el mensaje a la conversación
                const message = {
                    role,
                    content: content.replace(/^"|"$/g, ''), // Remover comillas
                    timestamp
                };
                
                currentConversation.messages.push(message);
                
                // Extraer tags del contenido
                this.extractTags(content, currentConversation.tags);
            }
            
            // Convertir el Map a un array de conversaciones
            const processedConversations = Array.from(conversations.values()).map(conv => ({
                ...conv,
                summary: this.generateConversationSummary(conv.messages),
                tags: Array.from(conv.tags)
            }));
            
            // Extraer información del hotel de todas las conversaciones
            const allContent = processedConversations
                .flatMap(conv => conv.messages)
                .map(msg => msg.content)
                .join('\n');
                
            return {
                conversations: processedConversations,
                extractedInfo: this.extractHotelInfo(allContent)
            };
        } catch (error) {
            console.error('Error procesando contenido CSV:', error);
            throw error;
        }
    }

    private parseCSVLine(line: string): string[] {
        const values: string[] = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Agregar el último valor
        values.push(currentValue.trim());
        
        return values;
    }

    private extractConversations(content: string): any[] {
        const conversations = [];
        let currentConversation = {
            messages: [],
            tags: new Set<string>()
        };

        // Dividir el contenido en líneas
            const lines = content.split('\n');

            for (const line of lines) {
            // Ignorar líneas vacías
                if (!line.trim()) continue;

            // Detectar si es un mensaje del usuario o del asistente
            if (line.startsWith('Usuario:') || line.startsWith('Cliente:')) {
                const message = {
                    role: 'user',
                    content: line.substring(line.indexOf(':') + 1).trim(),
                    timestamp: new Date().toISOString()
                };
                currentConversation.messages.push(message);

                // Extraer tags basados en el contenido
                this.extractTags(message.content, currentConversation.tags);
            } else if (line.startsWith('Asistente:') || line.startsWith('Hotel:')) {
                const message = {
                    role: 'assistant',
                    content: line.substring(line.indexOf(':') + 1).trim(),
                    timestamp: new Date().toISOString()
                };
                currentConversation.messages.push(message);

                // Extraer tags basados en el contenido
                this.extractTags(message.content, currentConversation.tags);
            } else if (line.startsWith('---')) {
                // Finalizar conversación actual si tiene mensajes
                if (currentConversation.messages.length > 0) {
                    conversations.push({
                        id: crypto.randomUUID(),
                        messages: currentConversation.messages,
                        summary: this.generateConversationSummary(currentConversation.messages),
                        tags: Array.from(currentConversation.tags)
                    });
                    currentConversation = {
                        messages: [],
                        tags: new Set<string>()
                    };
                }
            }
        }

        // Agregar la última conversación si tiene mensajes
        if (currentConversation.messages.length > 0) {
            conversations.push({
                id: crypto.randomUUID(),
                messages: currentConversation.messages,
                summary: this.generateConversationSummary(currentConversation.messages),
                tags: Array.from(currentConversation.tags)
            });
        }

        return conversations;
    }

    private extractTags(content: string, tags: Set<string>): void {
        const tagPatterns = {
            reserva: /reserv[ae][rs]?|dispon[ie]|fecha|tarifa|precio/i,
            habitaciones: /habitaci[óo]n|cuarto|suite|bungalow/i,
            servicios: /servicio|desayuno|wifi|piscina|restaurant/i,
            pagos: /pag[ao]|transfer|dep[óo]sito|tarjeta/i,
            consultas: /informaci[óo]n|consult[ao]|pregunt[ao]/i,
            problemas: /problema|queja|reclamo|error/i
        };

        for (const [tag, pattern] of Object.entries(tagPatterns)) {
            if (pattern.test(content)) {
                tags.add(tag);
            }
        }
    }

    private generateConversationSummary(messages: any[]): string {
        // Unir todos los mensajes en un solo texto
        const fullText = messages.map(m => m.content).join(' ');
        
        // Identificar el tema principal
        const topics = {
            reserva: /reserv[ae][rs]?|dispon[ie]|fecha|tarifa|precio/i,
            habitaciones: /habitaci[óo]n|cuarto|suite|bungalow/i,
            servicios: /servicio|desayuno|wifi|piscina|restaurant/i,
            pagos: /pag[ao]|transfer|dep[óo]sito|tarjeta/i,
            consultas: /informaci[óo]n|consult[ao]|pregunt[ao]/i
        };

        let mainTopic = 'general';
        let maxMatches = 0;

        for (const [topic, pattern] of Object.entries(topics)) {
            const matches = (fullText.match(pattern) || []).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                mainTopic = topic;
            }
        }

        // Generar resumen basado en el tema principal
        const summaryTemplates = {
            reserva: 'Consulta sobre reservación y disponibilidad',
            habitaciones: 'Información sobre tipos de habitaciones',
            servicios: 'Consulta sobre servicios del hotel',
            pagos: 'Información sobre métodos de pago',
            consultas: 'Consulta general sobre el hotel',
            general: 'Conversación general'
        };

        return summaryTemplates[mainTopic] || summaryTemplates.general;
    }

    private extractHotelInfo(content: string): any {
        const hotelInfo = {
            amenities: new Set<string>(),
            policies: new Set<string>(),
            roomTypes: new Set<string>(),
            services: new Set<string>()
        };

        // Patrones para extraer información
        const patterns = {
            amenities: [
                /wifi|internet/i,
                /piscina|pool/i,
                /aire acondicionado|ac|air conditioning/i,
                /tv|television|cable/i,
                /frigobar|minibar/i,
                /balc[óo]n|terraza/i
            ],
            policies: [
                /check-?in:\s*(\d{1,2}:\d{2})/i,
                /check-?out:\s*(\d{1,2}:\d{2})/i,
                /no\s+mascotas/i,
                /no\s+fumar/i,
                /m[íi]nimo\s+(\d+)\s+noches?/i
            ],
            roomTypes: [
                /matrimonial/i,
                /doble|twin/i,
                /triple/i,
                /cu[áa]druple/i,
                /suite/i,
                /familiar/i,
                /vista al mar/i
            ],
            services: [
                /desayuno|breakfast/i,
                /limpieza|housekeeping/i,
                /restaurant/i,
                /bar/i,
                /estacionamiento|parking/i,
                /lavander[íi]a|laundry/i
            ]
        };

        // Procesar el contenido línea por línea
        const lines = content.split('\n');
        for (const line of lines) {
            for (const [category, categoryPatterns] of Object.entries(patterns)) {
                for (const pattern of categoryPatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        hotelInfo[category].add(match[0].trim());
                    }
                }
            }
        }

        // Convertir Sets a Arrays
        return {
            amenities: Array.from(hotelInfo.amenities),
            policies: Array.from(hotelInfo.policies),
            roomTypes: Array.from(hotelInfo.roomTypes),
            services: Array.from(hotelInfo.services)
        };
    }

    async getAllTrainings() {
        try {
            console.log('Getting all trainings...');
            const trainings = await this.prisma.training.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    filename: true,
                    status: true,
                    progress: true,
                    error: true,
                    createdAt: true
                }
            });

            console.log('Found trainings:', trainings.length);

            // Transformar las fechas a string ISO
            const formattedTrainings = trainings.map(training => ({
                ...training,
                createdAt: training.createdAt.toISOString()
            }));

            return formattedTrainings;
        } catch (error) {
            console.error('Error getting trainings:', error);
            throw new HttpException(
                'Error al obtener los entrenamientos',
                HttpStatus.INTERNAL_SERVER_ERROR,
                { cause: error }
            );
        }
    }

    async getTrainingStatus(trainingId: string) {
        try {
            const training = await this.prisma.training.findUnique({
                where: { id: trainingId },
                select: {
                    id: true,
                    status: true,
                    progress: true,
                    error: true,
                    createdAt: true
                }
            });

            if (!training) {
                throw new HttpException(
                    'Entrenamiento no encontrado',
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                ...training,
                createdAt: training.createdAt.toISOString()
            };
        } catch (error) {
            console.error('Error getting training status:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Error al obtener el estado del entrenamiento',
                HttpStatus.INTERNAL_SERVER_ERROR,
                { cause: error }
            );
        }
    }

    private async loadAIConfig(): Promise<void> {
        try {
            const aiConfig = await this.prisma.aIConfig.findFirst({
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!aiConfig) {
                // Crear configuración por defecto con Kluster AI
                await this.prisma.aIConfig.create({
                    data: {
                        provider: 'kluster',
                        apiKey: 'api:2b912469-b12e-41f6-a7a2-c065aa47197d',
                        baseURL: 'https://api.kluster.ai/v1',
                        model: 'klusterai/Meta-Llama-3.3-70B-Instruct-Turbo',
                        exchangeRate: '3.80',
                        customInstructions: `Eres un asistente virtual del Hotel Peña Linda Bungalows. Cuando menciones precios de habitaciones, debes hacer la conversión de dólares a soles usando el tipo de cambio del día. 
Por ejemplo, si una habitación cuesta $100 USD y el tipo de cambio es 3.80, deberás indicar: "La habitación cuesta $100 USD (S/. 380 soles)".
Siempre muestra ambos precios: en dólares y en soles.`
                    }
                });
                await this.loadAIConfig();
                return;
            }

            this.config = {
                model: aiConfig.model,
                baseURL: aiConfig.baseURL,
                exchangeRate: aiConfig.exchangeRate,
                customInstructions: aiConfig.customInstructions,
                maxTokens: 150,
                temperature: 0.7,
                presencePenalty: 0.6,
                frequencyPenalty: 0.5,
                contextWindow: 10
            };

            const openAIConfig: any = {
                apiKey: aiConfig.apiKey,
                baseURL: this.config.baseURL
            };

            if (aiConfig.provider === 'kluster') {
                openAIConfig.defaultHeaders = {
                    'api-key': aiConfig.apiKey
                };
            }

            this.openai = new OpenAI(openAIConfig);

            console.log('AI configurada correctamente:', {
                model: this.config.model,
                baseURL: this.config.baseURL,
                provider: aiConfig.provider
            });
        } catch (error) {
            console.error('Error cargando configuración de AI:', error);
            throw error;
        }
    }

    async getConfig() {
        const config = await this.prisma.aIConfig.findFirst({
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                provider: true,
                apiKey: true,
                baseURL: true,
                model: true,
                exchangeRate: true,
                customInstructions: true
            }
        });

        return config || {
            provider: 'kluster',
            apiKey: 'api:2b912469-b12e-41f6-a7a2-c065aa47197d',
            baseURL: 'https://api.kluster.ai/v1',
            model: 'klusterai/Meta-Llama-3.1-8B-Instruct-Turbo',
            exchangeRate: '3.80',
            customInstructions: this.config?.customInstructions || `Eres un asistente virtual del Hotel Cascade. Cuando menciones precios de habitaciones, debes hacer la conversión de dólares a soles usando el tipo de cambio del día. 
Por ejemplo, si una habitación cuesta $100 USD y el tipo de cambio es 3.80, deberás indicar: "La habitación cuesta $100 USD (S/. 380 soles)".
Siempre muestra ambos precios: en dólares y en soles.`
        };
    }

    async updateConfig(config: {
        provider: string;
        apiKey: string;
        baseURL: string;
        model: string;
        exchangeRate: string;
        customInstructions: string;
    }) {
        try {
            // Validar la configuración antes de guardar
            if (!this.isValidConfig(config)) {
                throw new Error('Configuración inválida');
            }

            // Crear nueva configuración
            const newConfig = await this.prisma.aIConfig.create({
                data: { 
                    provider: config.provider,
                    // Usar la API key proporcionada o la predeterminada si está vacía
                    apiKey: config.apiKey || (config.provider === 'kluster' ? 'api:2b912469-b12e-41f6-a7a2-c065aa47197d' : ''),
                    baseURL: config.baseURL,
                    model: config.model,
                    exchangeRate: config.exchangeRate,
                    customInstructions: config.customInstructions
                }
            });

            // Probar la conexión con el proveedor de AI
            const testConfig = new OpenAI({
                apiKey: newConfig.apiKey,
                baseURL: newConfig.baseURL,
                defaultHeaders: newConfig.provider === 'kluster' ? {
                    'api-key': newConfig.apiKey
                } : undefined
            });

            // Intentar una llamada de prueba
            await testConfig.chat.completions.create({
                model: newConfig.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 5
            });

            // Si la prueba es exitosa, recargar la configuración
            await this.loadAIConfig();

            return {
                ...newConfig,
                apiKey: '[HIDDEN]' // Ocultar la API key en la respuesta
            };
        } catch (error) {
            console.error('Error actualizando configuración de AI:', error);
            
            // Manejar diferentes tipos de errores
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error('API Key inválida o sin autorización');
            } else if (error.response?.status === 404) {
                throw new Error('Modelo no encontrado');
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new Error('No se pudo conectar con el servicio de AI');
            } else if (error.message.includes('Configuración inválida')) {
                throw new Error('La configuración proporcionada no es válida');
            }

            throw new Error('Error al actualizar la configuración de AI');
        }
    }

    private isValidConfig(config: {
        provider: string;
        apiKey: string;
        baseURL: string;
        model: string;
        exchangeRate: string;
        customInstructions: string;
    }): boolean {
        // Validar proveedor
        if (!['glhf', 'kluster'].includes(config.provider)) {
            return false;
        }

        // Validar URL base
        try {
            new URL(config.baseURL);
        } catch {
            return false;
        }

        // Validar tipo de cambio
        const exchangeRate = parseFloat(config.exchangeRate);
        if (isNaN(exchangeRate) || exchangeRate <= 0) {
            return false;
        }

        // Validar modelo según el proveedor
        if (config.provider === 'glhf' && !['gpt-3.5-turbo', 'gpt-4'].includes(config.model)) {
            return false;
        } else if (config.provider === 'kluster') {
            const validKlusterModels = [
                'klusterai/Meta-Llama-3.1-8B-Instruct-Turbo',
                'klusterai/Meta-Llama-3.1-405B-Instruct-Turbo',
                'klusterai/Meta-Llama-3.3-70B-Instruct-Turbo',
                'deepseek-ai/DeepSeek-R1'
            ];
            if (!validKlusterModels.includes(config.model)) {
                return false;
            }
        }

        // Validar API key
        if (!config.apiKey && config.provider !== 'kluster') {
            return false;
        }

        // Validar instrucciones personalizadas
        if (!config.customInstructions || config.customInstructions.length < 10) {
            return false;
        }

        return true;
    }

    private async initializeAI(): Promise<void> {
        try {
            await this.loadAIConfig();
        } catch (error) {
            console.error('Error inicializando AI:', error);
            throw new Error('Error al inicializar la configuración de AI');
        }
    }

    private getConversationContext(userId: string): any[] {
        if (!this.conversationContext.has(userId)) {
            this.conversationContext.set(userId, []);
        }
        return this.conversationContext.get(userId)!;
    }

    private updateConversationContext(userId: string, message: string, response: string): void {
        const context = this.getConversationContext(userId);
        context.push(
            { role: 'user', content: message },
            { role: 'assistant', content: response }
        );

        // Mantener solo las últimas N interacciones
        while (context.length > this.config.contextWindow * 2) {
            context.shift();
        }
    }

    private async getFallbackResponse(error: any): Promise<AIResponse> {
        console.error('Error en el procesamiento principal:', error);
        
        try {
            // Intentar encontrar un script de fallback
            const fallbackScript = await this.findMatchingScript('error_fallback');
            if (fallbackScript) {
                return {
                    success: true,
                    response: fallbackScript.response,
                    source: 'fallback_script'
                };
            }
        } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError);
        }

        return {
            success: false,
            response: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta nuevamente en unos momentos.',
            source: 'error_handler'
        };
    }

    async chat(message: string, userId: string = 'default'): Promise<AIResponse> {
        try {
            // Verificar caché
            const cacheKey = `${userId}:${message}`;
            const cachedResponse = this.cache.get<AIResponse>(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Extraer fechas y huéspedes primero
            const dates = this.extractDates(message);
            const guests = this.extractGuests(message);
            
            // Si tenemos fechas o huéspedes, procesar como consulta de reserva
            if (dates || guests.length > 0 || this.isBookingRelatedQuery(this.classifyMessage(message, false))) {
                const bookingResponse = await this.processMessage(message);
                return {
                    success: true,
                    response: bookingResponse,
                    source: 'ai' as const
                };
            }

            // Intentar encontrar un script que coincida
            const matchingScript = await this.findMatchingScript(message);
            if (matchingScript?.score > 0.4) {
                console.log('Usando respuesta de script:', matchingScript.name);
                return {
                    success: true,
                    response: matchingScript.response,
                    source: 'script' as const
                };
            }

            // Buscar en los datos de entrenamiento
            try {
                const training = await this.prisma.training.findFirst({
                    where: { status: 'completed' },
                    orderBy: { createdAt: 'desc' }
                });

                if (training?.processedContent) {
                    const content = training.processedContent as {
                        conversations: Array<{
                            messages: Array<{
                                role: string;
                                content: string;
                            }>;
                        }>;
                        extractedInfo: {
                            commonQuestions: Array<{
                                question: string;
                                answer: string;
                                frequency: number;
                            }>;
                            hotelInfo: {
                                amenities: string[];
                                policies: string[];
                                roomTypes: string[];
                                services: string[];
                            };
                        };
                    };
                    
                    // Buscar en preguntas frecuentes primero
                    for (const q of content.extractedInfo.commonQuestions) {
                        const similarity = this.calculateSimilarity(
                            message.toLowerCase(),
                            q.question.toLowerCase()
                        );
                        if (similarity > 0.6) {
                            console.log('Usando respuesta de pregunta frecuente:', q.question);
                            return {
                                success: true,
                                response: q.answer,
                                source: 'ai' as const
                            };
                        }
                    }

                    // Buscar en conversaciones de entrenamiento
                    let bestMatch = null;
                    let highestScore = 0;

                    for (const conv of content.conversations) {
                        for (let i = 0; i < conv.messages.length; i++) {
                            if (conv.messages[i].role === 'user') {
                                const similarity = this.calculateSimilarity(
                                    message.toLowerCase(),
                                    conv.messages[i].content.toLowerCase()
                                );

                                if (similarity > highestScore && similarity > 0.4) {
                                    highestScore = similarity;
                                    bestMatch = conv.messages[i + 1]?.content;
                                }
                            }
                        }
                    }

                    if (bestMatch) {
                        console.log('Usando respuesta de conversación de entrenamiento');
                        const response = {
                            success: true,
                            response: bestMatch,
                            source: 'ai' as const
                        };
                        this.cache.set(cacheKey, response);
                        return response;
                    }

                    // Preparar contexto enriquecido para Kluster AI
                    const hotelInfo = content.extractedInfo.hotelInfo;
                    const contextPrompt = `
                        Información del Hotel:
                        - Amenidades: ${hotelInfo.amenities.join(', ')}
                        - Políticas: ${hotelInfo.policies.join(', ')}
                        - Tipos de Habitación: ${hotelInfo.roomTypes.join(', ')}
                        - Servicios: ${hotelInfo.services.join(', ')}

                        Basándote en esta información y en las siguientes instrucciones, responde la consulta del usuario.
                        ${this.config.customInstructions}
                    `;

                    // Usar Kluster AI con contexto enriquecido
                    console.log('Usando Kluster AI con contexto enriquecido');
                    const completion = await this.openai.chat.completions.create({
                        model: this.config.model,
                        messages: [
                            {
                                role: "system",
                                content: contextPrompt
                            },
                            ...this.getConversationContext(userId),
                            {
                                role: "user",
                                content: message
                            }
                        ],
                        max_tokens: this.config.maxTokens,
                        temperature: this.config.temperature,
                        presence_penalty: this.config.presencePenalty,
                        frequency_penalty: this.config.frequencyPenalty
                    });

                    const response = {
                        success: true,
                        response: completion.choices[0].message.content?.trim() || 'Lo siento, no pude generar una respuesta.',
                        source: 'ai' as const
                    };

                    this.updateConversationContext(userId, message, response.response);
                    this.cache.set(cacheKey, response);
                    return response;
                }
            } catch (error) {
                console.error('Error buscando en datos de entrenamiento:', error);
            }

            // Fallback a Kluster AI sin contexto enriquecido
            console.log('Usando Kluster AI sin contexto enriquecido (fallback)');
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: "system",
                        content: this.config.customInstructions
                    },
                    ...this.getConversationContext(userId),
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                presence_penalty: this.config.presencePenalty,
                frequency_penalty: this.config.frequencyPenalty
            });

            const response = {
                success: true,
                response: completion.choices[0].message.content?.trim() || 'Lo siento, no pude generar una respuesta.',
                source: 'ai' as const
            };

            this.updateConversationContext(userId, message, response.response);
            this.cache.set(cacheKey, response);
            return response;
        } catch (error) {
            return this.getFallbackResponse(error);
        }
    }

    private classifyMessage(message: string, isHotel: boolean): string {
        const text = message.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        // Patrones de consulta de reserva/tarifas
        const pricePatterns = [
            /(?:cuanto|cuánto|precio|costo|tarifa|valor)/i,
            /(?:para|del|desde)\s+(?:\d{1,2})/i,
            /(?:disponible|disponibilidad|hay|tienen)/i,
            /(?:reserv|apart|separ|confirm)/i
        ];

        // Si cualquier patrón de reserva coincide, clasificar como consulta de tarifas
        if (pricePatterns.some(pattern => pattern.test(text))) {
            return 'price_inquiry';
        }

        if (isHotel) {
            return this.classifyHotelMessage(text);
        }

        return this.classifyClientMessage(text);
    }

    private classifyHotelMessage(text: string): string {
        if (text.includes('cotiz')) return 'quote';
        if (text.includes('disponible')) return 'availability';
        if (text.includes('gracias por preferirnos')) return 'confirmation';
        if (text.includes('desayuno') || text.includes('incluye')) return 'amenities';
        if (text.includes('reserva') && text.includes('hoy')) return 'sales_technique';
        return 'hotel_response';
    }

    private classifyClientMessage(text: string): string {
        if (text.match(/(?:matrimonial|individual|doble|triple|cuádruple|familiar)/i)) return 'room_type_inquiry';
        if (text.match(/(?:para|somos|viajamos)\s+(?:\d+|un|dos|tres|cuatro|cinco|seis)/i)) return 'occupancy_inquiry';
        if (text.match(/(?:pag|deposit|transfer|adelant)/i)) return 'payment_inquiry';
        if (text.match(/(?:informacion|info|duda|pregunta|quisiera saber)/i)) return 'information_request';
        return 'client_message';
    }

    private extractDates(message: string): any {
        try {
            const lowerMessage = message.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            // Patrones de fecha mejorados
            const patterns = [
                // "del 27 al 30 de agosto"
                {
                    pattern: /(?:del?\s+)?(\d{1,2})\s+(?:al|hasta|a)\s+(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+(?:del?\s+)?(\d{4}))?/i,
                    process: (match: any) => this.processDateMatch(match)
                },
                // "27 al 30 de agosto"
                {
                    pattern: /(\d{1,2})\s+(?:al|hasta|a)\s+(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+(?:del?\s+)?(\d{4}))?/i,
                    process: (match: any) => this.processDateMatch(match)
                },
                // "27 de marzo al 1 de abril"
                {
                    pattern: /(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:al|hasta)\s+(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+(?:del?\s+)?(\d{4}))?/i,
                    process: (match: any) => this.processDateMatchTwoMonths(match)
                },
                // "del 27 de marzo al 1 de abril"
                {
                    pattern: /(?:del?\s+)?(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:al|hasta)\s+(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+(?:del?\s+)?(\d{4}))?/i,
                    process: (match: any) => this.processDateMatchTwoMonths(match)
                }
            ];

            for (const {pattern, process} of patterns) {
                const match = lowerMessage.match(pattern);
                if (match) {
                    const result = process(match);
                    if (result && this.isValidDateRange(result.checkIn, result.checkOut)) {
                        return result;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error en extractDates:', error);
            return null;
        }
    }

    private processDateMatch(match: any): any {
        const startDay = parseInt(match[1]);
        const endDay = parseInt(match[2]);
        const month = this.getMonthNumber(match[3]);
        const year = match[4] ? parseInt(match[4]) : this.getDefaultYear();

        if (startDay && endDay && month !== -1) {
            const checkIn = new Date(year, month, startDay);
            const checkOut = new Date(year, month, endDay);
            return { checkIn, checkOut };
        }
        return null;
    }

    private processDateMatchTwoMonths(match: any): any {
        const startDay = parseInt(match[1]);
        const startMonth = this.getMonthNumber(match[2]);
        const endDay = parseInt(match[3]);
        const endMonth = this.getMonthNumber(match[4]);
        const year = match[5] ? parseInt(match[5]) : this.getDefaultYear();

        if (startDay && endDay && startMonth !== -1 && endMonth !== -1) {
            let checkIn = new Date(year, startMonth, startDay);
            let checkOut = new Date(year, endMonth, endDay);

            // Si el mes de salida es anterior al mes de entrada, asumimos que es del año siguiente
            if (endMonth < startMonth) {
                checkOut.setFullYear(year + 1);
            }

            return { checkIn, checkOut };
        }
        return null;
    }

    private getDefaultYear(): number {
        const today = new Date();
        return today.getFullYear() + (today.getMonth() > 10 ? 1 : 0);
    }

    private getMonthNumber(monthStr: string): number {
        const months: { [key: string]: number } = {
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
            'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
            'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
            'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3,
            'may': 4, 'jun': 5, 'jul': 6, 'ago': 7,
            'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
        };
        return months[monthStr.toLowerCase()] ?? -1;
    }

    private isValidDateRange(checkIn: Date, checkOut: Date): boolean {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        return checkIn instanceof Date && 
               checkOut instanceof Date && 
               !isNaN(checkIn.getTime()) && 
               !isNaN(checkOut.getTime()) && 
               checkIn >= now && 
               checkOut > checkIn;
    }

    private extractGuests(message: string): any[] {
        try {
            const lowerMessage = message.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const patterns = [
                // "para 2 personas"
                {
                    pattern: /(?:para|somos|con|)?\s*(\d+)\s*(?:personas?|pax|huespedes?|adultos?)?/i,
                    process: (match: any) => parseInt(match[1])
                },
                // "para 2"
                {
                    pattern: /(?:para|somos|con)\s*(\d+)(?:\s|$)/i,
                    process: (match: any) => parseInt(match[1])
                },
                // Números escritos
                {
                    pattern: /(?:para|somos|con)\s*(un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*(?:personas?|pax|huespedes?|adultos?)?/i,
                    process: (match: any) => this.convertWordToNumber(match[1])
                }
            ];

            for (const {pattern, process} of patterns) {
                const match = lowerMessage.match(pattern);
                if (match) {
                    const count = process(match);
                    if (count > 0 && count <= 10) {
                        return Array(count).fill({ type: 'adult' });
                    }
                }
            }

            return [];
        } catch (error) {
            console.error('Error en extractGuests:', error);
            return [];
        }
    }

    private convertWordToNumber(word: string): number {
        const numberMap: { [key: string]: number } = {
            'un': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
            'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8,
            'nueve': 9, 'diez': 10
        };
        return numberMap[word.toLowerCase()] || 0;
    }

    private extractRoomType(message: string): string | null {
        const roomTypes = [
            'matrimonial',
            'individual',
            'doble',
            'triple',
            'cuádruple',
            'familiar'
        ];

        const lowerMessage = message.toLowerCase();
        for (const type of roomTypes) {
            if (lowerMessage.includes(type)) {
                return type;
            }
        }

        return null;
    }

    private calculatePayingGuests(guests: any[]): number {
        return guests.reduce((total, guest) => {
            if (guest.type === 'adult' || (guest.type === 'child' && guest.age && guest.age >= 4)) {
                return total + 1;
            }
            return total;
        }, 0);
    }

    private async generateMultiRoomRecommendation(
        rooms: any[],
        distribution: any[],
        checkIn: Date,
        checkOut: Date,
        nights: number,
        exchangeRate: number
    ): Promise<string> {
        console.log('Generando recomendación para múltiples habitaciones:', {
            roomCount: rooms.length,
            distributionCount: distribution.length,
            checkIn,
            checkOut,
            nights,
            exchangeRate
        });

        let response = '';
        response += `📅 FECHAS DE RESERVA\n`;
        response += `Entrada: ${checkIn.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
        response += `Salida: ${checkOut.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
        response += `Duración: ${nights} noche${nights !== 1 ? 's' : ''}\n`;
        response += `Temporada: ${this.getTemporada(checkIn)}\n\n`;

        let totalAmount = 0;
        let totalWithDiscount = 0;

        // Procesar cada habitación solicitada
        for (const roomDist of distribution) {
            const guestCount = roomDist.guests.length;
            console.log(`Buscando habitación para ${guestCount} huéspedes`);
            
            // Encontrar una habitación adecuada
            const suitableRoom = rooms.find(room => room.capacity >= guestCount);
            if (!suitableRoom) {
                return `Lo siento, no tenemos habitaciones disponibles para el grupo de ${guestCount} personas.`;
            }

            // Calcular tarifas para esta habitación
            const rates = await this.calculateRoomRate(suitableRoom, checkIn, checkOut);

            totalAmount += rates.total;
            totalWithDiscount += rates.discountedTotal;

            response += `\n🏨 HABITACIÓN ${roomDist.roomNumber}\n`;
            response += `Tipo: ${suitableRoom.name}\n`;
            response += `Características: ${suitableRoom.description}\n`;
            response += `Capacidad máxima: ${suitableRoom.capacity} personas\n`;
            response += `Huéspedes: ${this.formatGuestList(roomDist.guests)}\n\n`;

            response += `💰 TARIFAS HABITACIÓN ${roomDist.roomNumber}\n`;
            response += `Tarifa por noche: *S/. ${(rates.nightlyRate * exchangeRate).toFixed(2)} soles*\n`;
            response += `Tarifa por ${nights} noche${nights !== 1 ? 's' : ''}: *S/. ${(rates.subtotal * exchangeRate).toFixed(2)} soles*\n`;
            response += `IGV (10%): *S/. ${(rates.igv * exchangeRate).toFixed(2)} soles*\n`;
            response += `Total: *S/. ${(rates.total * exchangeRate).toFixed(2)} *\n\n`;
        }

        // Agregar totales generales
        response += `💫 TOTAL GENERAL\n`;
        response += `Total sin descuento: *S/. ${(totalAmount * exchangeRate).toFixed(2)} soles*\n`;
        response += `Total con 25% descuento: *S/. ${(totalWithDiscount * exchangeRate).toFixed(2)} soles*\n`;
        response += `Adelanto del 50%: *S/. ${(totalWithDiscount * 0.5 * exchangeRate).toFixed(2)} soles*\n\n`;

        // Agregar beneficios y restricciones
        response += `✨ BENEFICIOS INCLUIDOS\n`;
        response += `• Desayunos buffet incluidos\n`;
        response += `• 1 ronda de chilcano pisco de cortesía\n`;
        response += `• Acceso a la piscina\n`;
        response += `• WiFi de alta velocidad\n\n`;

        response += `⚠ RESTRICCIONES DE ESTADÍA\n`;
        response += `• Domingo a jueves: mínimo 1 noche\n`;
        response += `• Viernes a domingo: mínimo 2 noches\n`;
        response += `• Feriados y festivos: mínimo 3 noches\n`;
        response += `• Año Nuevo y Fiestas Patrias: mínimo 5 noches\n\n`;

        response += `🔒 ¿DESEA CONFIRMAR SU RESERVA?\n`;
        response += `Para proceder con la reserva necesitaré los siguientes datos:\n`;
        response += `• Nombre completo\n`;
        response += `• DNI o Pasaporte\n`;
        response += `• Email\n`;
        response += `• Teléfono de contacto\n\n`;

        response += `¿Desea proceder con la reserva?`;

        return response;
    }

    private async generateSingleRoomResponse(
        room: any,
        guests: any[],
        checkIn: Date,
        checkOut: Date,
        nights: number,
        exchangeRate: number
    ): Promise<string> {
            const temporada = this.getTemporada(checkIn);
        const rates = await this.calculateRoomRate(room, checkIn, checkOut);

            let response = '';
                response += `📅 FECHAS DE RESERVA\n`;
            response += `Entrada: ${checkIn.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
            response += `Salida: ${checkOut.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
            response += `Duración: ${nights} noche${nights !== 1 ? 's' : ''}\n`;
            response += `Temporada: ${temporada}\n\n`;

            response += `👥 DESGLOSE DE HUÉSPEDES\n`;
        response += this.formatGuestList(guests) + '\n\n';

            response += `🏨 DETALLES DE LA HABITACIÓN\n`;
            response += `Tipo: ${room.name}\n`;
            response += `Características: ${room.description}\n`;
            response += `Capacidad máxima: ${room.capacity} personas\n\n`;

            response += `💰 TARIFAS Y COSTOS\n`;
        response += `Tarifa por noche: *S/. ${(rates.nightlyRate * exchangeRate).toFixed(2)} soles*\n`;
        response += `Tarifa por ${nights} noche${nights !== 1 ? 's' : ''}: *S/. ${(rates.subtotal * exchangeRate).toFixed(2)} soles*\n`;
        response += `IGV (10%): *S/. ${(rates.igv * exchangeRate).toFixed(2)} soles*\n`;
        response += `Total: *S/. ${(rates.total * exchangeRate).toFixed(2)} soles*\n\n`;

            response += `✨ BENEFICIOS INCLUIDOS\n`;
            response += `• Desayunos buffet incluidos\n`;
            response += `• 1 ronda de chilcano pisco de cortesía\n`;
            response += `• Acceso a la piscina\n`;
            response += `• WiFi de alta velocidad\n\n`;

            response += `🎉 OFERTA ESPECIAL\n`;
            response += `Reserva HOY con el 50% de adelanto y obtén:\n`;
            response += `• 25% de descuento en la tarifa\n`;
            response += `• 10% de descuento adicional en consumos\n\n`;

            response += `💫 PRECIO FINAL CON DESCUENTO\n`;
        response += `*S/. ${(rates.discountedTotal * exchangeRate).toFixed(2)} soles*\n`;
        response += `Adelanto del 50%: *S/. ${(rates.discountedTotal * 0.5 * exchangeRate).toFixed(2)} soles*\n\n`;

            response += `⚠ RESTRICCIONES DE ESTADÍA\n`;
            response += `• Domingo a jueves: mínimo 1 noche\n`;
            response += `• Viernes a domingo: mínimo 2 noches\n`;
            response += `• Feriados y festivos: mínimo 3 noches\n`;
            response += `• Año Nuevo y Fiestas Patrias: mínimo 5 noches\n\n`;

            response += `🔒 ¿DESEA CONFIRMAR SU RESERVA?\n`;
            response += `Para proceder con la reserva necesitaré los siguientes datos:\n`;
            response += `• Nombre completo\n`;
            response += `• DNI o Pasaporte\n`;
            response += `• Email\n`;
            response += `• Teléfono de contacto\n\n`;

            response += `¿Desea proceder con la reserva?`;

            return response;
    }

    private async getRoomInfo(message: string): Promise<string | null> {
        try {
            console.log('Analizando consulta de habitación:', message);
            
            // Extraer información directamente
            const dates = this.extractDates(message);
            const guests = this.extractGuests(message);
            const roomType = this.extractRoomType(message);
            
            // Actualizar la última consulta
            this.lastBookingQuery = {
                dates,
                guests,
                roomType
            };

            // Si tenemos la información necesaria
            if (dates && guests.length > 0) {
                const rooms = await this.roomsService.findAll();
                const availableRooms = this.filterAvailableRooms(rooms, this.lastBookingQuery);
                return this.generateRoomRecommendation(availableRooms, this.lastBookingQuery);
            }

            // Si falta información
            return this.generatePromptForMissingInfo(this.lastBookingQuery);
        } catch (error) {
            console.error('Error en getRoomInfo:', error);
            return 'Lo siento, hubo un error al procesar tu consulta. ¿Podrías intentarlo de nuevo?';
        }
    }

    async processMessage(message: string): Promise<string> {
        try {
            console.log('Procesando mensaje:', message);

            // Detectar si es una consulta de múltiples habitaciones
            const hasMultipleRooms = this.isMultiRoomQuery(message);
            console.log('¿Es consulta de múltiples habitaciones?:', hasMultipleRooms);

            if (hasMultipleRooms) {
                console.log('Procesando consulta de múltiples habitaciones...');
                const dates = this.extractDates(message);
                const distribution = this.extractRoomDistribution(message);
                console.log('Distribución extraída:', distribution);

                if (!dates || !distribution.length) {
                    return this.generatePromptForMissingInfo({});
                }

                // Obtener todas las habitaciones disponibles
                console.log('Consultando habitaciones disponibles...');
                const rooms = await this.roomsService.findAll();

                // Generar recomendación para múltiples habitaciones
                return this.generateMultiRoomRecommendation(
                    rooms,
                    distribution,
                    dates.checkIn,
                    dates.checkOut,
                    Math.ceil((dates.checkOut.getTime() - dates.checkIn.getTime()) / (1000 * 60 * 60 * 24)),
                    parseFloat((await this.prisma.aIConfig.findFirst())?.exchangeRate || '3.80')
                );
            }

            // Resto del código para consultas de una sola habitación...
            const dates = this.extractDates(message);
            const guests = this.extractGuests(message);

            if (dates || guests.length > 0) {
                console.log('Procesando como consulta de tarifas simple');
                return this.handleBookingQuery(message, dates, guests);
            }

            return this.generatePromptForMissingInfo({});
        } catch (error) {
            console.error('Error en processMessage:', error);
            return 'Lo siento, ocurrió un error al procesar tu consulta. ¿Podrías intentarlo de nuevo?';
        }
    }

    private isMultiRoomQuery(message: string): boolean {
        const lowerMessage = message.toLowerCase();
        
        // Patrón para detectar "X habitaciones para Y personas"
        const pattern = /(\d+)\s*habitaciones\s*(?:para\s*(\d+)\s*personas?)?/i;
        const match = message.match(pattern);
        
        if (match) {
            const roomCount = parseInt(match[1]);
            return roomCount > 1;
        }
        
        return false;
    }

    private extractRoomDistribution(message: string): any[] {
        console.log('Extrayendo distribución de habitaciones del mensaje:', message);
        const distribution = [];
        const lines = message.split('\n').map(line => line.trim());
        
        // Extraer el número total de habitaciones y personas
        const totalRoomsMatch = message.match(/(\d+)\s*habitaciones/i);
        const totalGuestsMatch = message.match(/(\d+)\s*personas/i);
        
        if (totalRoomsMatch && totalGuestsMatch) {
            const totalRooms = parseInt(totalRoomsMatch[1]);
            const totalGuests = parseInt(totalGuestsMatch[1]);
            
            // Calcular la distribución equitativa
            const guestsPerRoom = Math.ceil(totalGuests / totalRooms);
            
            for (let i = 1; i <= totalRooms; i++) {
                distribution.push({
                    roomNumber: i,
                    guests: Array(guestsPerRoom).fill({ type: 'adult' })
                });
            }
        }

        console.log('Distribución final extraída:', distribution);
        return distribution;
    }

    private extractTotalGuests(message: string, type: 'adultos' | 'niños'): number {
        const pattern = new RegExp(`(\\d+)\\s*${type}`, 'i');
        const match = message.match(pattern);
        return match ? parseInt(match[1]) : 0;
    }

    private isBookingRelatedQuery(messageType: string): boolean {
        const bookingTypes = [
            'price_inquiry',
            'availability_inquiry',
            'room_type_inquiry',
            'occupancy_inquiry',
            'booking_intent'
        ];
        return bookingTypes.includes(messageType);
    }

    private async handleBookingQuery(
        message: string,
        dates: any,
        guests: any[]
    ): Promise<string> {
        // Actualizar lastBookingQuery solo si hay nueva información
        if (dates || guests.length > 0) {
            this.lastBookingQuery = {
                ...this.lastBookingQuery,
                dates: dates || this.lastBookingQuery?.dates,
                guests: guests.length > 0 ? guests : this.lastBookingQuery?.guests,
                message: message // Agregar el mensaje original
            };
        }

        // Si tenemos toda la información necesaria
        if (this.lastBookingQuery?.dates && this.lastBookingQuery?.guests?.length > 0) {
            const rooms = await this.roomsService.findAll();
            const availableRooms = this.filterAvailableRooms(rooms, this.lastBookingQuery);
            return this.generateRoomRecommendation(availableRooms, this.lastBookingQuery);
        }

        // Si falta información
        return this.generatePromptForMissingInfo(this.lastBookingQuery);
    }

    private filterAvailableRooms(rooms: any[], query: any): any[] {
        const payingGuests = this.calculatePayingGuests(query.guests);
        const wantsPrimerPiso = query.message?.toLowerCase().includes('primer piso');
        const wantsPisoSuperior = query.message?.toLowerCase().includes('piso superior');
        const temporada = this.getTemporada(query.dates.checkIn);
        const esFeriadoLargo = this.isFeriadoLargo(query.dates.checkIn);
        
        console.log('Filtrando habitaciones con los siguientes criterios:', {
            payingGuests,
            wantsPrimerPiso,
            wantsPisoSuperior,
            temporada,
            esFeriadoLargo
        });
        
        // Primero filtrar por capacidad y ubicación
        let filteredRooms = rooms.filter(room => {
            // Filtrar por capacidad
            const capacity = room.capacity || 2;
            if (payingGuests > capacity) return false;
            
            // Filtrar por ubicación si se especificó
            if (wantsPrimerPiso && !room.name.toLowerCase().includes('primer piso')) return false;
            if (wantsPisoSuperior && !room.name.toLowerCase().includes('piso superior')) return false;
            
            return true;
        });

        // Si no hay habitaciones disponibles después del filtro, retornar array vacío
        if (filteredRooms.length === 0) return [];

        // Si es feriado largo, priorizar habitaciones con tarifa específica
        if (esFeriadoLargo) {
            const roomsWithHolidayRate = filteredRooms.filter(room => 
                room.name.toLowerCase().includes('año nuevo y fiestas patrias')
            );
            
            if (roomsWithHolidayRate.length > 0) {
                console.log('Encontradas habitaciones con tarifa específica para feriado largo:', 
                    roomsWithHolidayRate.map(r => r.name));
                filteredRooms = roomsWithHolidayRate;
            }
        }

        // Ordenar las habitaciones
        return filteredRooms
            .sort((a, b) => {
                // Si es feriado largo, priorizar habitaciones con tarifa específica
                if (esFeriadoLargo) {
                    const aHasHolidayRate = a.name.toLowerCase().includes('año nuevo y fiestas patrias');
                    const bHasHolidayRate = b.name.toLowerCase().includes('año nuevo y fiestas patrias');
                    if (aHasHolidayRate && !bHasHolidayRate) return -1;
                    if (!aHasHolidayRate && bHasHolidayRate) return 1;
                }

                // Luego ordenar por ubicación solicitada
                if (wantsPrimerPiso) {
                    if (a.name.toLowerCase().includes('primer piso') && !b.name.toLowerCase().includes('primer piso')) return -1;
                    if (!a.name.toLowerCase().includes('primer piso') && b.name.toLowerCase().includes('primer piso')) return 1;
                }
                if (wantsPisoSuperior) {
                    if (a.name.toLowerCase().includes('piso superior') && !b.name.toLowerCase().includes('piso superior')) return -1;
                    if (!a.name.toLowerCase().includes('piso superior') && b.name.toLowerCase().includes('piso superior')) return 1;
                }
                
                // Luego ordenar por capacidad más cercana a la necesaria
                const diffA = Math.abs(a.capacity - payingGuests);
                const diffB = Math.abs(b.capacity - payingGuests);
                if (diffA !== diffB) return diffA - diffB;
                
                // Si tienen la misma diferencia de capacidad, priorizar la más económica
                const tarifaA = this.getTarifaBase(a, temporada, esFeriadoLargo);
                const tarifaB = this.getTarifaBase(b, temporada, esFeriadoLargo);
                return tarifaA - tarifaB;
            })
            .map(room => ({
                ...room,
                rates: room.rates || []
            }));
    }

    private getTarifaBase(room: any, temporada: string, esFeriadoLargo: boolean): number {
        // Si es feriado largo, buscar primero tarifa específica
        if (esFeriadoLargo) {
            // 1. Buscar en el nombre de la habitación
            if (room.name?.toLowerCase().includes('año nuevo y fiestas patrias')) {
                console.log('Usando tarifa base de habitación de feriado:', room.rackRate);
                return room.rackRate;
            }

            // 2. Buscar en las tarifas
            const tarifas = room.rates || [];
            const tarifaFeriado = tarifas.find((t: any) => 
                t.name?.toLowerCase().includes('año nuevo y fiestas patrias')
            );

            if (tarifaFeriado) {
                console.log('Usando tarifa específica de feriado:', tarifaFeriado.tarifaBase);
                return tarifaFeriado.tarifaBase;
            }
        }

        // Si no es feriado largo o no se encontró tarifa específica
        const tarifas = room.rates || [];
        let tarifaSeleccionada;

        switch (temporada) {
            case 'alta':
                tarifaSeleccionada = tarifas.find((t: any) => 
                    t.name?.toLowerCase().includes('temp alta') || 
                    t.name?.toLowerCase().includes('temporada alta') ||
                    t.name?.toLowerCase().includes('verano 2025')
                );
                break;
            case 'baja':
                tarifaSeleccionada = tarifas.find((t: any) => 
                    t.name?.toLowerCase().includes('temp baja') || 
                    t.name?.toLowerCase().includes('temporada baja')
                );
                break;
            default:
                tarifaSeleccionada = tarifas.find((t: any) => 
                    t.name?.toLowerCase().includes('temp alta') || 
                    t.name?.toLowerCase().includes('temporada alta')
                );
        }

        if (tarifaSeleccionada) {
            console.log('Usando tarifa según temporada:', {
                nombre: tarifaSeleccionada.name,
                tarifa: tarifaSeleccionada.tarifaBase
            });
            return tarifaSeleccionada.tarifaBase;
        }

        // Si no se encontró ninguna tarifa específica, usar rack rate
        console.log('Usando rack rate por defecto:', room.rackRate);
        return room.rackRate || 0;
    }

    private generatePromptForMissingInfo(query: any): string {
        if (!query?.dates && !query?.guests?.length) {
            return `Para brindarte información precisa sobre tarifas y disponibilidad, necesito saber:

📅 ¿Para qué fechas te gustaría hospedarte?
   Por ejemplo: "del 26 al 30 de junio"

👥 ¿Cuántas personas se hospedarían?
   Por ejemplo: "2 personas" o "2 adultos y 1 niño"`;
        }

        if (!query?.dates) {
            return `Gracias por indicar el número de personas. Para mostrarte las tarifas exactas, 
¿Para qué fechas te gustaría reservar?
Por ejemplo: "del 26 al 30 de junio"`;
        }

        if (!query?.guests?.length) {
            return `Perfecto, ya tengo las fechas. Para mostrarte las mejores opciones,
¿Para cuántas personas sería la reserva?
Por ejemplo: "2 personas" o "2 adultos y 1 niño"`;
        }

        return 'Por favor, indícame en qué más puedo ayudarte.';
    }

    private async findMatchingScript(message: string): Promise<any | null> {
        try {
            console.log('Buscando script coincidente para:', message);
            
            // Normalizar el mensaje de entrada
            const normalizedInput = message.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();

            // Verificar si es una consulta de fechas/tarifas
            const hasDatePattern = /(?:del?\s+)?\d{1,2}\s+(?:al|hasta|a)\s+\d{1,2}\s+(?:de\s+)?[a-z]+/i.test(normalizedInput);
            const hasGuestPattern = /(?:para|somos|con)\s*(?:\d+|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*(?:personas?|pax|huespedes?|adultos?)?/i.test(normalizedInput);
            
            // Si es una consulta de fechas/tarifas, no buscar en scripts
            if (hasDatePattern || hasGuestPattern) {
                console.log('Detectada consulta de fechas/tarifas, omitiendo scripts');
                return null;
            }

            // Obtener todos los scripts activos y datos de entrenamiento
            const scripts = await this.scriptsService.findAll();
            const activeScripts = scripts.filter(script => script.active);
            console.log('Scripts activos:', activeScripts.length);

            // Intentar encontrar coincidencia exacta primero
            for (const script of activeScripts) {
                try {
                    const triggers = JSON.parse(script.triggers);
                    for (const trigger of triggers) {
                        const normalizedTrigger = trigger.toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .trim();

                        if (normalizedInput === normalizedTrigger || 
                            normalizedInput.includes(normalizedTrigger) || 
                            normalizedTrigger.includes(normalizedInput)) {
                            console.log('¡Coincidencia exacta encontrada!');
                            return { ...script, score: 1 };
                        }
                    }
                } catch (error) {
                    console.error(`Error procesando triggers para script ${script.id}:`, error);
                    continue;
                }
            }

            // Si no hay coincidencia exacta, buscar coincidencia parcial
            let bestMatch = null;
            let highestScore = 0;

            for (const script of activeScripts) {
                try {
                    const triggers = JSON.parse(script.triggers);
                    for (const trigger of triggers) {
                        const normalizedTrigger = trigger.toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .trim();

                        const similarity = this.calculateSimilarity(normalizedInput, normalizedTrigger);
                        console.log(`Similitud con "${trigger}": ${similarity}`);

                        if (similarity > highestScore) {
                            highestScore = similarity;
                            bestMatch = { ...script, score: similarity };
                        }
                    }
                } catch (error) {
                    console.error(`Error procesando triggers para script ${script.id}:`, error);
                    continue;
                }
            }

            // Retornar el mejor match si supera el umbral mínimo (reducido a 0.4 para mayor flexibilidad)
            return highestScore > 0.4 ? bestMatch : null;
        } catch (error) {
            console.error('Error en findMatchingScript:', error);
            return null;
        }
    }

    private calculateSimilarity(str1: string, str2: string): number {
        // Convertir a conjuntos de palabras
        const words1 = new Set(str1.split(/\s+/));
        const words2 = new Set(str2.split(/\s+/));

        // Calcular intersección y unión
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        // Calcular coeficiente de Jaccard
        return intersection.size / union.size;
    }

    private extractReservationData(message: string): any {
        const lines = message.split('\n').map(line => line.trim());
        
        return {
            nombre: lines[0] || null,
            documento: lines[1] || null,
            email: lines[2]?.toLowerCase() || null,
            telefono: lines[3] || null
        };
    }

    private async processReservationData(message: string): Promise<string> {
        try {
            const data = this.extractReservationData(message);
            
            if (!data.nombre || !data.documento || !data.email || !data.telefono) {
                return 'Lo siento, necesito todos los datos para procesar la reserva. Por favor, proporciona:\n' +
                       '• Nombre completo\n' +
                       '• DNI o Pasaporte\n' +
                       '• Email\n' +
                       '• Teléfono de contacto';
            }

            // Validar formato de email básico
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                return 'El formato del correo electrónico no es válido. Por favor, verifica y envía nuevamente los datos.';
            }

            // Validar formato de teléfono (asumiendo formato peruano)
            const phoneRegex = /^9\d{8}$/;
            if (!phoneRegex.test(data.telefono)) {
                return 'El formato del número de teléfono no es válido. Debe ser un número de 9 dígitos comenzando con 9.';
            }

            let bookingDetails = '';
            if (this.lastBookingQuery?.dates) {
                const checkIn = new Date(this.lastBookingQuery.dates.checkIn);
                const checkOut = new Date(this.lastBookingQuery.dates.checkOut);
                const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                
                const payingGuests = this.calculatePayingGuests(this.lastBookingQuery.guests);
                const totalGuests = this.lastBookingQuery.guests.length;
                
                bookingDetails = `\nDETALLES DE LA RESERVA:\n` +
                    `• Check-in: ${this.formatDate(checkIn)}\n` +
                    `• Check-out: ${this.formatDate(checkOut)}\n` +
                    `• Duración: ${nights} noche${nights > 1 ? 's' : ''}\n` +
                    `• Total huéspedes: ${totalGuests}\n` +
                    `• Huéspedes que pagan: ${payingGuests}\n`;
            }

            return `¡Excelente ${data.nombre}! 🎉\n\n` +
                   `Hemos recibido tus datos correctamente para procesar la reservación:\n` +
                   `• Nombre: ${data.nombre}\n` +
                   `• Documento: ${data.documento}\n` +
                   `• Email: ${data.email}\n` +
                   `• Teléfono: ${data.telefono}\n` +
                   `${bookingDetails}\n` +
                   `En los próximos minutos estaremos registrando tu reservación y enviaremos las instrucciones de pago al correo ${data.email}. 📧\n\n` +
                   `Recuerda que para confirmar la reserva necesitarás realizar el pago del 50% de adelanto y así asegurar el descuento especial del 25%. 💰\n\n` +
                   `Si tienes alguna pregunta adicional, no dudes en consultarnos. ¡Estamos para ayudarte! 😊`;
        } catch (error) {
            console.error('Error al procesar datos de reservación:', error);
            return 'Lo siento, ha ocurrido un error al procesar tus datos. Por favor, intenta nuevamente.';
        }
    }

    async processUserMessage(message: string): Promise<any> {
        try {
            if (!this.openai) {
                await this.initializeAI();
            }

            console.log('Processing message:', message);

            // Buscar un script que coincida
            const matchingScript = await this.findMatchingScript(message);
            
            if (matchingScript) {
                console.log('Found matching script:', matchingScript.name);
                return matchingScript.response;
            }

            // Si no hay script coincidente, usar OpenAI
            console.log('No matching script found, using OpenAI');
            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: "system",
                        content: this.config.customInstructions
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 150,
                temperature: 0.7,
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error processing message:', error);
            throw new Error('Error al procesar el mensaje');
        }
    }

    private async generateBookingSummary(): Promise<string> {
        if (!this.lastBookingQuery?.dates) {
            return '';
        }

        try {
            const checkIn = new Date(this.lastBookingQuery.dates.checkIn);
            const checkOut = new Date(this.lastBookingQuery.dates.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const payingGuests = this.calculatePayingGuests(this.lastBookingQuery.guests);
            const totalGuests = this.lastBookingQuery.guests.length;

            return `
                Resumen de tu reserva:
                - Check-in: ${checkIn.toLocaleDateString()}
                - Check-out: ${checkOut.toLocaleDateString()}
                - Noches: ${nights}
                - Huéspedes: ${totalGuests} (${payingGuests} pagantes)
                ${this.lastBookingQuery.roomType ? `- Tipo de habitación: ${this.lastBookingQuery.roomType}` : ''}
            `.trim();
        } catch (error) {
            console.error('Error generating booking summary:', error);
            return '';
        }
    }

    private formatDate(date: Date): string {
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${date.getDate()} de ${months[date.getMonth()]} del ${date.getFullYear()}`;
    }

    async startTraining(trainingId: string) {
        try {
            console.log('Iniciando entrenamiento para ID:', trainingId);
            const training = await this.prisma.training.findUnique({
                where: { id: trainingId }
            });

            if (!training) {
                throw new Error('Training not found');
            }

            if (training.status === 'completed') {
                throw new Error('El entrenamiento ya está completado');
            }

            await this.prisma.training.update({
                where: { id: trainingId },
                data: { 
                    status: 'processing',
                    progress: 0
                }
            });

            // Procesar el archivo de forma asíncrona
            this.processTrainingFile(training.filepath).catch(async (error) => {
                console.error('Error procesando archivo:', error);
                await this.prisma.training.update({
                    where: { id: trainingId },
                    data: { 
                        status: 'error',
                        error: error.message
                    }
                });
            });

            return { message: 'Entrenamiento iniciado' };
        } catch (error) {
            console.error('Error starting training:', error);
            throw new HttpException(
                'Error al iniciar el entrenamiento',
                HttpStatus.INTERNAL_SERVER_ERROR,
                { cause: error }
            );
        }
    }

    private isFestivo(date: Date): boolean {
        // Feriados y festivos en Perú
        const festivosPeruanos = [
            { dia: 1, mes: 1 },    // Año Nuevo
            { dia: 1, mes: 5 },    // Día del Trabajo
            { dia: 29, mes: 6 },   // San Pedro y San Pablo
            { dia: 28, mes: 7 },   // Fiestas Patrias
            { dia: 29, mes: 7 },   // Fiestas Patrias
            { dia: 30, mes: 8 },   // Santa Rosa de Lima
            { dia: 8, mes: 10 },   // Combate de Angamos
            { dia: 1, mes: 11 },   // Todos los Santos
            { dia: 8, mes: 12 },   // Inmaculada Concepción
            { dia: 25, mes: 12 }   // Navidad
        ];

        return festivosPeruanos.some(festivo => 
            festivo.dia === date.getDate() && festivo.mes === (date.getMonth() + 1)
        );
    }

    private getTemporada(date: Date): 'alta' | 'media' | 'baja' {
        const mes = date.getMonth() + 1;  // getMonth() devuelve 0-11
        const dia = date.getDate();
        const esFeriadoLargo = this.isFeriadoLargo(date);

        console.log(`Evaluando temporada para fecha: ${date.toLocaleDateString()} (${mes}/${dia})`);

        // Si es feriado largo, siempre es temporada alta
        if (esFeriadoLargo) {
            console.log('Es feriado largo -> Temporada Alta');
            return 'alta';
        }

        // Temporada Alta
        // 1. Verano (26 Dic - 15 Mar)
        if ((mes === 12 && dia >= 26) || 
            (mes === 1) || 
            (mes === 2) || 
            (mes === 3 && dia <= 15)) {
            console.log('Temporada Alta: Verano');
            return 'alta';
        }

        // 2. Vacaciones medio año y Fiestas Patrias (28 Jun - 31 Jul)
        if ((mes === 6 && dia >= 28) || 
            (mes === 7)) {
            console.log('Temporada Alta: Vacaciones medio año/Fiestas Patrias');
            return 'alta';
        }

        // 3. Navidad y Año Nuevo (24 Dic - 31 Dic)
        if (mes === 12 && dia >= 24) {
            console.log('Temporada Alta: Navidad y Año Nuevo');
            return 'alta';
        }

        // 4. Semana Santa (17 - 20 Abr)
        if (mes === 4 && dia >= 17 && dia <= 20) {
            console.log('Temporada Alta: Semana Santa');
            return 'alta';
        }

        // 5. Carnavales (28 Feb - 2 Mar)
        if ((mes === 2 && dia >= 28) || 
            (mes === 3 && dia <= 2)) {
            console.log('Temporada Alta: Carnavales');
            return 'alta';
        }

        // Temporada Media
        // 1. Fin de verano (16 Mar - 30 May)
        if ((mes === 3 && dia >= 16) || 
            mes === 4 || 
            (mes === 5 && dia <= 30)) {
            console.log('Temporada Media: Fin de verano');
            return 'media';
        }

        // 2. Post Fiestas Patrias (1 Ago - 30 Sep)
        if (mes === 8 || mes === 9) {
            console.log('Temporada Media: Post Fiestas Patrias');
            return 'media';
        }

        // Temporada Baja
        // 1. Octubre a mediados de diciembre (1 Oct - 23 Dic)
        if ((mes >= 10 && mes <= 11) || 
            (mes === 12 && dia <= 23)) {
            console.log('Temporada Baja: Pre temporada alta');
        return 'baja';
    }

        // 2. Inicio de invierno (1 Jun - 27 Jun)
        if (mes === 6 && dia <= 27) {
            console.log('Temporada Baja: Inicio de invierno');
            return 'baja';
        }

        // Por defecto, si no cae en ninguna categoría específica
        console.log('Temporada Baja: Fecha no categorizada específicamente');
        return 'baja';
    }

    private getFactorTemporada(checkIn: Date, checkOut: Date): number {
        const dias = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        let factorTotal = 0;
        
        console.log('Calculando factor de temporada para:', {
            checkIn: checkIn.toLocaleDateString(),
            checkOut: checkOut.toLocaleDateString(),
            dias
        });
        
        for (let i = 0; i < dias; i++) {
            const fecha = new Date(checkIn);
            fecha.setDate(fecha.getDate() + i);
            
            const temporada = this.getTemporada(fecha);
            const esFestivo = this.isFestivo(fecha);
            const esFinDeSemana = this.isWeekend(fecha);
            
            // Factor base según temporada
            let factorDia = 1;
            
            // Factor por temporada
            switch (temporada) {
                case 'alta':
                    factorDia *= 1.5; // +50% temporada alta
                    console.log(`Día ${fecha.toLocaleDateString()} - Temporada Alta (+50%)`);
                    break;
                case 'media':
                    factorDia *= 1.25; // +25% temporada media
                    console.log(`Día ${fecha.toLocaleDateString()} - Temporada Media (+25%)`);
                    break;
                case 'baja':
                    factorDia *= 1; // tarifa base
                    console.log(`Día ${fecha.toLocaleDateString()} - Temporada Baja (tarifa base)`);
                    break;
            }
            
            // Factor por fin de semana
            if (esFinDeSemana) {
                factorDia *= 1.2; // +20% fines de semana
                console.log(`Día ${fecha.toLocaleDateString()} - Fin de semana (+20%)`);
            }
            
            // Factor por festivo
            if (esFestivo) {
                factorDia *= 1.25; // +25% festivos
                console.log(`Día ${fecha.toLocaleDateString()} - Festivo (+25%)`);
            }
            
            factorTotal += factorDia;
            console.log(`Factor del día: ${factorDia}`);
        }
        
        const factorPromedio = factorTotal / dias;
        console.log('Factor promedio final:', factorPromedio);
        
        return factorPromedio;
    }

    private isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 es domingo, 6 es sábado
    }

    private isFeriadoLargo(date: Date): boolean {
        const mes = date.getMonth() + 1;  // getMonth() devuelve 0-11
        const dia = date.getDate();

        // Navidad y Año Nuevo (24 Dic - 3 Ene)
        if ((mes === 12 && dia >= 24) || 
            (mes === 1 && dia <= 3)) {
            console.log('Feriado Largo: Navidad y Año Nuevo');
            return true;
        }
        
        // Fiestas Patrias (26 Jul - 31 Jul)
        if (mes === 7 && dia >= 26 && dia <= 31) {
            console.log('Feriado Largo: Fiestas Patrias');
            return true;
        }

        // Semana Santa (17 - 20 Abr)
        if (mes === 4 && dia >= 17 && dia <= 20) {
            console.log('Feriado Largo: Semana Santa');
            return true;
        }

        // Carnavales (28 Feb - 2 Mar)
        if ((mes === 2 && dia >= 28) || 
            (mes === 3 && dia <= 2)) {
            console.log('Feriado Largo: Carnavales');
            return true;
        }
        
        return false;
    }

    private validarRestriccionesNoches(checkIn: Date, nights: number): { valido: boolean; mensaje: string } {
        const diaInicio = checkIn.getDay();
        const esFeriadoLargo = this.isFeriadoLargo(checkIn);
        const mes = checkIn.getMonth() + 1;
        const dia = checkIn.getDate();
        
        // Año Nuevo y Fiestas Patrias: 5 noches mínimo
        if (((mes === 12 && dia >= 24) || (mes === 1 && dia <= 3)) || // Año Nuevo
            (mes === 7 && dia >= 26 && dia <= 31)) { // Fiestas Patrias
            if (nights < 5) {
            return {
                valido: false,
                mensaje: "Para reservas en Año Nuevo y Fiestas Patrias se requiere un mínimo de 5 noches."
            };
            }
        }
        
        // Semana Santa: 4 noches mínimo
        if (mes === 4 && dia >= 17 && dia <= 20) {
            if (nights < 4) {
            return {
                valido: false,
                    mensaje: "Para reservas en Semana Santa se requiere un mínimo de 4 noches."
            };
            }
        }
        
        // Carnavales: 3 noches mínimo
        if ((mes === 2 && dia >= 28) || (mes === 3 && dia <= 2)) {
            if (nights < 3) {
            return {
                valido: false,
                    mensaje: "Para reservas en Carnavales se requiere un mínimo de 3 noches."
                };
            }
        }
        
        // Fines de semana: 2 noches mínimo (viernes a domingo)
        if ((diaInicio === 5 || diaInicio === 6) && nights < 2) {
            return {
                valido: false,
                mensaje: "Para reservas de fin de semana (viernes a domingo) se requiere un mínimo de 2 noches."
            };
        }
        
        return { valido: true, mensaje: "" };
    }

    async getTrainingContent(id: string): Promise<any> {
        try {
            const training = await this.prisma.training.findUnique({
                where: { id },
                select: {
                    id: true,
                    filename: true,
                    filepath: true,
                    status: true,
                    progress: true,
                    error: true,
                    processedContent: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!training) {
                throw new HttpException('Training not found', HttpStatus.NOT_FOUND);
            }

            // Si el archivo aún no ha sido procesado
            if (training.status !== 'completed') {
                return {
                    status: training.status,
                    progress: training.progress,
                    error: training.error
                };
            }

            // Si no hay contenido procesado, procesarlo ahora
            if (!training.processedContent) {
                try {
                    const fileContent = await fs.readFile(training.filepath, 'utf-8');
                    const conversations = this.extractConversations(fileContent);
                    const extractedInfo = this.extractHotelInfo(fileContent);
                    
                    const processedContent = {
                        conversations,
                        extractedInfo
                    };

                    // Actualizar el training con el contenido procesado
                    await this.prisma.training.update({
                        where: { id },
                        data: {
                            processedContent,
                            status: 'completed'
                        }
                    });

                    return processedContent;
        } catch (error) {
                    console.error('Error procesando el archivo:', error);
                    throw new HttpException(
                        'Error al procesar el archivo de entrenamiento',
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }

            // Retornar el contenido procesado
            return training.processedContent;
        } catch (error) {
            console.error('Error obteniendo contenido del training:', error);
            throw new HttpException(
                'Error al obtener el contenido del training',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private async getRoomRateForDate(room: any, date: Date): Promise<number> {
        const temporada = this.getTemporada(date);
        const esFinDeSemana = this.isWeekend(date);
        const esFeriadoLargo = this.isFeriadoLargo(date);
        const esFestivo = this.isFestivo(date);
        
        console.log(`\n=== CONSULTANDO TARIFA PARA ${date.toLocaleDateString()} ===`);
        console.log(`Habitación:`, room);
        console.log(`Temporada: ${temporada}`);
        console.log(`Fin de semana: ${esFinDeSemana}`);
        console.log(`Feriado largo: ${esFeriadoLargo}`);
        console.log(`Festivo: ${esFestivo}`);
        console.log(`Rack Rate:`, room.rackRate);

        // Obtener todas las tarifas disponibles para la habitación
        const tarifas = room.occupancyRates || [];
        console.log('\nTodas las tarifas disponibles:', JSON.stringify(tarifas, null, 2));

        // Filtrar tarifas válidas para la fecha
        const tarifasValidas = tarifas.filter((t: any) => {
            const startDate = new Date(t.startDate);
            const endDate = new Date(t.endDate);
            const isValid = date >= startDate && date <= endDate;
            console.log(`Evaluando tarifa:`, {
                nombre: t.name,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString(),
                fechaConsulta: date.toLocaleDateString(),
                esValida: isValid
            });
            return isValid;
        });

        console.log('\nTarifas válidas para la fecha:', JSON.stringify(tarifasValidas, null, 2));

        // 1. Prioridad máxima: Feriados largos específicos
        if (esFeriadoLargo) {
            console.log('\nBuscando tarifa de feriado largo...');
            const tarifaFeriadoLargo = tarifasValidas.find((t: any) => {
                const nombre = t.name?.toLowerCase() || '';
                const esTarifaFeriado = nombre.includes('año nuevo') || 
                                  nombre.includes('fiestas patrias') ||
                                  nombre.includes('feriado');
                console.log(`Evaluando si es tarifa de feriado:`, {
                    nombre,
                    esTarifaFeriado
                });
                return esTarifaFeriado;
            });

            if (tarifaFeriadoLargo) {
                console.log('\nUsando tarifa de feriado largo:', {
                    nombre: tarifaFeriadoLargo.name,
                    tarifa: tarifaFeriadoLargo.rate
                });
                return tarifaFeriadoLargo.rate;
            }

            // Si no hay tarifa específica de feriado, buscar en el nombre de la habitación
            if (room.name?.toLowerCase().includes('año nuevo y fiestas patrias')) {
                const tarifaBase = room.rackRate;
                console.log('\nUsando tarifa base de habitación de feriado:', tarifaBase);
                return tarifaBase;
            }

            // Si aún no encontramos tarifa, buscar otra habitación del mismo tipo con tarifa de feriado
            const roomsService = this.roomsService;
            const allRooms = await roomsService.findAll();
            const similarRooms = allRooms.filter(r => 
                r.type === room.type && 
                r.name?.toLowerCase().includes('año nuevo y fiestas patrias')
            );

            if (similarRooms.length > 0) {
                const tarifaReferencia = similarRooms[0].rackRate;
                console.log('\nUsando tarifa de referencia de habitación similar:', tarifaReferencia);
                return tarifaReferencia;
            }
        }

        // 2. Temporada Alta
        if (temporada === 'alta') {
            console.log('\nBuscando tarifa de temporada alta...');
            const tarifaAlta = tarifasValidas.find((t: any) => {
                const nombre = t.name?.toLowerCase() || '';
                const esTarifaAlta = nombre.includes('temp alta') || 
                                   nombre.includes('temporada alta') ||
                                   nombre.includes('verano 2025');
                console.log(`Evaluando si es tarifa alta:`, {
                    nombre,
                    esTarifaAlta
                });
                return esTarifaAlta;
            });

            if (tarifaAlta) {
                console.log('\nUsando tarifa de temporada alta:', {
                    nombre: tarifaAlta.name,
                    tarifa: tarifaAlta.rate
                });
                return tarifaAlta.rate;
            }

            // Si no hay tarifa específica, buscar en el nombre de la habitación
            if (room.name?.toLowerCase().includes('temp alta') || 
                room.name?.toLowerCase().includes('temporada alta')) {
                const tarifaBase = room.rackRate;
                console.log('\nUsando tarifa base de habitación de temporada alta:', tarifaBase);
                return tarifaBase;
            }
        }

        // 3. Tarifas según temporada y día de la semana
        console.log('\nBuscando tarifa según temporada y día de la semana...');
        let tarifaSeleccionada;
        
        if (temporada === 'alta' || temporada === 'media') {
            if (esFinDeSemana) {
                tarifaSeleccionada = tarifasValidas.find((t: any) => {
                    const nombre = t.name?.toLowerCase() || '';
                    const esTarifaCorrecta = nombre.includes('fin de semana') && 
                        (nombre.includes('temp alta') || nombre.includes('temporada alta'));
                    console.log(`Evaluando tarifa fin de semana alta:`, {
                        nombre,
                        esTarifaCorrecta
                    });
                    return esTarifaCorrecta;
                });
            } else {
                tarifaSeleccionada = tarifasValidas.find((t: any) => {
                    const nombre = t.name?.toLowerCase() || '';
                    const esTarifaCorrecta = nombre.includes('domingo a jueves') && 
                        (nombre.includes('temp alta') || nombre.includes('temporada alta'));
                    console.log(`Evaluando tarifa entre semana alta:`, {
                        nombre,
                        esTarifaCorrecta
                    });
                    return esTarifaCorrecta;
                });
            }
        } else {
            if (esFinDeSemana) {
                tarifaSeleccionada = tarifasValidas.find((t: any) => {
                    const nombre = t.name?.toLowerCase() || '';
                    const esTarifaCorrecta = nombre.includes('fin de semana') && 
                        nombre.includes('temp baja');
                    console.log(`Evaluando tarifa fin de semana baja:`, {
                        nombre,
                        esTarifaCorrecta
                    });
                    return esTarifaCorrecta;
                });
            } else {
                tarifaSeleccionada = tarifasValidas.find((t: any) => {
                    const nombre = t.name?.toLowerCase() || '';
                    const esTarifaCorrecta = nombre.includes('domingo a jueves') && 
                        nombre.includes('temp baja');
                    console.log(`Evaluando tarifa entre semana baja:`, {
                        nombre,
                        esTarifaCorrecta
                    });
                    return esTarifaCorrecta;
                });
            }
        }

        if (tarifaSeleccionada) {
            console.log('\nUsando tarifa según temporada y día:', {
                nombre: tarifaSeleccionada.name,
                tarifa: tarifaSeleccionada.rate
            });
            return tarifaSeleccionada.rate;
        }

        // 4. Fallback: Usar la tarifa más alta disponible
        const tarifaMasAlta = [...tarifasValidas].sort((a, b) => b.rate - a.rate)[0];
        if (tarifaMasAlta) {
            console.log('\nUsando tarifa más alta como fallback:', {
                nombre: tarifaMasAlta.name,
                tarifa: tarifaMasAlta.rate
            });
            return tarifaMasAlta.rate;
        }

        // Si no hay tarifas disponibles, usar rack rate
        console.warn('\nNo se encontraron tarifas válidas, usando rack rate:', room.rackRate);
        return room.rackRate || 0;
    }

    private formatGuestList(guests: any[]): string {
        const adultCount = guests.filter(g => g.type === 'adult').length;
        const children = guests.filter(g => g.type === 'child');
        
        let guestList = `${adultCount} adulto${adultCount !== 1 ? 's' : ''}`;
        
        if (children.length > 0) {
            const childrenWithAge = children.filter(c => c.age);
            const childrenNoAge = children.filter(c => !c.age);
            
            if (childrenWithAge.length > 0) {
                guestList += ` y ${childrenWithAge.length} niño${childrenWithAge.length !== 1 ? 's' : ''} `;
                guestList += `(${childrenWithAge.map(c => `${c.age} años`).join(', ')})`;
            }
            
            if (childrenNoAge.length > 0) {
                if (childrenWithAge.length > 0) guestList += ' y ';
                guestList += `${childrenNoAge.length} niño${childrenNoAge.length !== 1 ? 's' : ''}`;
            }
        }
        
        return guestList;
    }

    private async calculateRoomRate(room: any, checkIn: Date, checkOut: Date): Promise<any> {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const baseRate = await this.getRoomRateForDate(room, checkIn);
        
        const subtotal = baseRate * nights;
        const igv = subtotal * 0.10; // 10% IGV
        const total = subtotal + igv;
        const discountedTotal = total * 0.75; // 25% de descuento
        
        return {
            nightlyRate: baseRate,
            subtotal,
            igv,
            total,
            discountedTotal,
            nights
        };
    }

    private async generateRoomRecommendation(rooms: any[], query: any): Promise<string> {
        if (!rooms || rooms.length === 0) {
            return 'Lo siento, no tenemos habitaciones disponibles que cumplan con tus requisitos en las fechas solicitadas.';
        }

        const checkIn = query.dates.checkIn;
        const checkOut = query.dates.checkOut;
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        // Validar restricciones de noches mínimas
        const validacion = this.validarRestriccionesNoches(checkIn, nights);
        if (!validacion.valido) {
            return validacion.mensaje;
        }

        // Obtener tipo de cambio
        const exchangeRate = parseFloat((await this.prisma.aIConfig.findFirst())?.exchangeRate || '3.80');

        // Si hay múltiples habitaciones necesarias
        if (this.needsMultipleRooms(query)) {
            const distribution = this.extractRoomDistribution(query.message);
            return this.generateMultiRoomRecommendation(
                rooms,
                distribution,
                checkIn,
                checkOut,
                nights,
                exchangeRate
            );
        }

        // Para una sola habitación
        const room = rooms[0];
        return this.generateSingleRoomResponse(
            room,
            query.guests,
            checkIn,
            checkOut,
            nights,
            exchangeRate
        );
    }

    private needsMultipleRooms(query: any): boolean {
        if (!query.message) return false;
        return this.isMultiRoomQuery(query.message);
    }

    // Agregar después del constructor
    async logRoomsAndRates() {
        try {
            const rooms = await this.roomsService.findAll();
            
            console.log('=== HABITACIONES Y TARIFAS EN LA BASE DE DATOS ===');
            rooms.forEach(room => {
                console.log('\nHabitación:', room.name);
                console.log('Capacidad:', room.capacity);
                console.log('Descripción:', room.description);
                console.log('Rack Rate:', room.rackRate);
                if (room.occupancyRates && Array.isArray(room.occupancyRates)) {
                    console.log('Tarifas:');
                    room.occupancyRates.forEach((rate: any) => {
                        console.log('  -', {
                            nombre: `${room.name} - ${rate.startDate.toLocaleDateString()} a ${rate.endDate.toLocaleDateString()}`,
                            tarifa: rate.rate
                        });
                    });
                } else {
                    console.log('No hay tarifas definidas para esta habitación');
                }
            });

            return rooms;
        } catch (error) {
            console.error('Error al consultar habitaciones:', error);
            throw error;
        }
    }
}