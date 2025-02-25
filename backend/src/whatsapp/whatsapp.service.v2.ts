import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import * as path from 'path';
import * as fs from 'fs';
import { AIService } from '../ai/ai.service';
import { SystemGateway } from '../system/system.gateway';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from '../chat/chat.gateway';

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

@Injectable()
export class WhatsappServiceV2 implements OnModuleInit {
  private client: Client;
  private qr: string = null;
  private status: 'disconnected' | 'connected' | 'connecting' = 'disconnected';
  private isInitialized = false;
  private initializationAttempts = 0;
  private readonly MAX_RETRIES = 3;
  private readonly SESSION_DIR = path.join(process.cwd(), 'whatsapp-auth-v2');
  public isConnected: boolean = false;

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    public aiService: AIService,
    @Inject(forwardRef(() => SystemGateway))
    private systemGateway: SystemGateway,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
    private configService: ConfigService,
  ) {
    // Solo crear el directorio en el constructor
    if (!fs.existsSync(this.SESSION_DIR)) {
      fs.mkdirSync(this.SESSION_DIR, { recursive: true });
    }
  }

  async onModuleInit() {
    console.log('=== INICIANDO MÓDULO WHATSAPP V2 ===');
    // Intentar inicializar con reintento automático
    await this.initializeWithRetry();
  }

  private async cleanupSession() {
    console.log('Limpiando sesión de WhatsApp...');
    try {
      // Destruir cliente existente
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (error) {
          console.error('Error al destruir cliente:', error);
        } finally {
          this.client = null;
        }
      }

      // Limpiar estados
      this.qr = null;
      this.status = 'disconnected';
      this.isConnected = false;
      this.isInitialized = false;

      // Limpiar directorio de sesión
      const sessionPath = path.join(this.SESSION_DIR, 'hotel-bot-v2');
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('Directorio de sesión eliminado:', sessionPath);
      }

      // Esperar un momento para asegurar la limpieza
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error durante la limpieza de sesión:', error);
    }
  }

  private async initializeWithRetry(maxRetries = 5, delayMs = 10000) {
    await this.cleanupSession();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intento de inicialización #${attempt} de ${maxRetries}`);

        // Esperar entre intentos
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Obtener configuración de Puppeteer
        const whatsappConfig = this.configService.get('whatsapp');
        if (!whatsappConfig?.puppeteer?.executablePath) {
          console.warn('No se encontró la ruta de Chrome. Asegúrate de tener Chrome instalado.');
        }
        console.log('Usando configuración de Puppeteer:', whatsappConfig?.puppeteer || 'Configuración por defecto');

        // Crear nueva instancia del cliente con manejo de errores mejorado
        try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'hotel-bot-v2',
          dataPath: this.SESSION_DIR
        }),
        puppeteer: {
              headless: "new",
              ...(whatsappConfig?.puppeteer || {}),
              defaultViewport: null,
              timeout: 300000,
              waitForInitialPage: true
            },
            qrMaxRetries: 10,
            authTimeoutMs: 300000,
        takeoverOnConflict: true,
            takeoverTimeoutMs: 180000
      });

          // Configurar eventos antes de inicializar
      this.setupEventListeners();

          // Inicializar el cliente con timeout
      console.log('=== INICIANDO CLIENTE WHATSAPP V2 ===');
          await Promise.race([
            this.client.initialize(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout al inicializar el cliente')), 300000)
            )
          ]);

          // Si llegamos aquí, la inicialización fue exitosa
          console.log('=== CLIENTE WHATSAPP V2 INICIALIZADO EXITOSAMENTE ===');
          this.initializationAttempts = 0;
          return true;
        } catch (initError) {
          console.error('Error al inicializar el cliente:', initError);
          throw initError;
        }
    } catch (error) {
        console.error(`Error en intento ${attempt}:`, error);
        await this.cleanupSession();

        // Si es el último intento, propagar el error
        if (attempt === maxRetries) {
          throw new Error(`No se pudo inicializar después de ${maxRetries} intentos: ${error.message}`);
        }
      }
    }
  }

  private setupEventListeners() {
    if (!this.client) return;

    // Evento cuando se genera el código QR
    this.client.on('qr', (qr) => {
        console.log('=== NUEVO CÓDIGO QR GENERADO (V2) ===');
      console.log('Longitud del QR:', qr.length);
      
        this.qr = qr;
      this.status = 'connecting';
      this.isConnected = false;
      this.isInitialized = false;
      
      this.systemGateway.broadcastStatus({
        whatsappConnection: 'connecting',
        aiStatus: 'online',
        aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
        lastUpdate: new Date(),
        qr: this.qr,
        status: this.status,
        error: null,
        isInitialized: this.isInitialized
      });
    });

    // Evento cuando se está cargando
    this.client.on('loading_screen', (percent, message) => {
      console.log('=== CARGANDO WHATSAPP ===', percent, message);
      this.status = 'connecting';
        this.isConnected = false;
        
        this.systemGateway.broadcastStatus({
        whatsappConnection: 'connecting',
            aiStatus: 'online',
            aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
            lastUpdate: new Date(),
            qr: this.qr,
            status: this.status,
        error: null,
            isInitialized: this.isInitialized,
        loadingMessage: `${message} (${percent}%)`
      });
    });

    // Evento cuando se autentica exitosamente
    this.client.on('authenticated', () => {
      console.log('=== WHATSAPP AUTENTICADO ===');
      this.status = 'connecting';
      this.isConnected = false;
      this.qr = null;
      
      this.systemGateway.broadcastStatus({
        whatsappConnection: 'connecting',
        aiStatus: 'online',
        aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
        lastUpdate: new Date(),
        qr: null,
        status: this.status,
        error: null,
        isInitialized: this.isInitialized
      });
    });

    // Evento cuando se está listo
    this.client.on('ready', () => {
      console.log('=== CLIENTE WHATSAPP V2 LISTO ===');
      this.status = 'connected';
      this.isConnected = true;
      this.isInitialized = true;
      this.qr = null;
      this.initializationAttempts = 0;

      this.systemGateway.broadcastStatus({
        whatsappConnection: 'connected',
        aiStatus: 'online',
        aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
        lastUpdate: new Date(),
        qr: null,
        status: this.status,
        error: null,
        isInitialized: this.isInitialized
        });
    });

    // Evento cuando se desconecta
    this.client.on('disconnected', async (reason) => {
      console.log('=== CLIENTE WHATSAPP V2 DESCONECTADO ===', reason);
      
      // Limpiar todo
      await this.cleanupSession();

      this.systemGateway.broadcastStatus({
        whatsappConnection: 'disconnected',
        aiStatus: 'online',
        aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
        lastUpdate: new Date(),
        qr: null,
        status: this.status,
        error: reason,
        isInitialized: this.isInitialized
      });

      // Solo reintentar si la desconexión no fue intencional
      const skipReconnectReasons = ['NAVIGATION', 'CONFLICT', 'LOGOUT'];
      if (!skipReconnectReasons.includes(reason)) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (!this.isConnected) {
          this.retryInitialization();
        }
      }
    });

    // Evento cuando falla la autenticación
    this.client.on('auth_failure', async (msg) => {
      console.error('=== ERROR DE AUTENTICACIÓN WHATSAPP V2 ===', msg);
      
      // Limpiar todo
      await this.cleanupSession();

      this.systemGateway.broadcastStatus({
        whatsappConnection: 'disconnected',
        aiStatus: 'online',
        aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
        lastUpdate: new Date(),
        qr: null,
        status: this.status,
        error: msg,
        isInitialized: this.isInitialized
      });

      // Intentar reconectar después de un breve retraso
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (!this.isConnected) {
        this.retryInitialization();
      }
    });

    // Evento para cambios en el estado de la conexión
    this.client.on('change_state', async (state) => {
      console.log('=== CAMBIO DE ESTADO WHATSAPP ===', state);
      
      // Manejar estados específicos que requieren reinicialización
      const statesRequiringReinit = ['CONFLICT', 'UNLAUNCHED', 'UNPAIRED', 'UNPAIRED_IDLE'];
      if (statesRequiringReinit.includes(state)) {
        await this.cleanupSession();
        this.retryInitialization();
      }
    });

    // Evento para monitorear la batería del dispositivo
    this.client.on('change_battery', (batteryInfo) => {
      console.log('=== ESTADO DE BATERÍA WHATSAPP ===', batteryInfo);
      if (batteryInfo.battery <= 15 && !batteryInfo.plugged) {
        console.warn('Advertencia: Batería baja en el dispositivo WhatsApp');
      }
    });

    // Evento para mensajes entrantes
    this.client.on('message', async (msg) => {
        try {
            console.log('=== MENSAJE ENTRANTE ===');
            console.log('De:', msg.from);
            console.log('Tipo:', msg.type);
            console.log('Contenido:', msg.body);
            console.log('ID del mensaje:', msg.id.id);
            console.log('Timestamp:', new Date(msg.timestamp * 1000).toISOString());

            // Obtener información del chat primero
            const chat = await msg.getChat();
            console.log('Chat ID:', chat.id._serialized);
            console.log('Nombre del chat:', chat.name);
            console.log('Es grupo:', chat.isGroup);

            // Ignorar mensajes de grupo por ahora
            if (chat.isGroup) {
                console.log('Ignorando mensaje de grupo');
                return;
            }
            
            // Crear o actualizar la conversación
            const conversation = await this.prisma.conversation.upsert({
                where: { whatsappId: chat.id._serialized },
                create: {
                    whatsappId: chat.id._serialized,
                    phoneNumber: msg.from.split('@')[0],
                    name: chat.name || msg.from.split('@')[0],
                    status: 'active',
                    lastMessage: msg.body,
                    lastMessageAt: new Date(msg.timestamp * 1000)
                },
                update: {
                    lastMessage: msg.body,
                    lastMessageAt: new Date(msg.timestamp * 1000),
                    status: 'active'
                }
            });
            console.log('Conversación creada/actualizada:', conversation.id);

            // Preparar metadatos del mensaje
            let metadata = null;
            if (msg.hasMedia) {
                console.log('Mensaje contiene multimedia');
                const media = await msg.downloadMedia();
                metadata = {
                    type: msg.type,
                    mimetype: media?.mimetype,
                    size: media?.filesize,
                    filename: media?.filename
                };
                console.log('Metadatos multimedia:', metadata);
            }

            // Guardar el mensaje del usuario
            const savedMessage = await this.prisma.message.create({
                data: {
                    whatsappId: msg.id.id,
                    content: msg.body,
                    sender: 'user',
                    status: 'received',
                    metadata: metadata ? JSON.stringify(metadata) : null,
                    conversation: {
                        connect: { id: conversation.id }
                    }
                }
            });
            console.log('Mensaje guardado en la base de datos:', savedMessage.id);

            // Emitir el evento de nuevo mensaje
            this.chatGateway.handleNewMessage({
                ...savedMessage,
                conversationId: conversation.id,
                timestamp: savedMessage.createdAt.toISOString(),
                createdAt: savedMessage.createdAt.toISOString()
            });

            // Procesar el mensaje con la IA y obtener respuesta
            try {
                console.log('Procesando mensaje con IA...');
                const aiResponse = await this.aiService.chat(msg.body, chat.id._serialized);
                
                if (aiResponse.success && aiResponse.response) {
                    console.log('Respuesta de IA obtenida, enviando mensaje...');
                    
                    // Enviar la respuesta por WhatsApp
                    const responseMsg = await this.client.sendMessage(msg.from, aiResponse.response);
                    
                    // Guardar la respuesta en la base de datos
                    const savedResponse = await this.prisma.message.create({
                        data: {
                            whatsappId: responseMsg.id.id,
                            content: aiResponse.response,
                            sender: 'bot',
                            status: 'sent',
                            metadata: JSON.stringify({
                                source: aiResponse.source,
                                processed_by: 'ai'
                            }),
                            conversation: {
                                connect: { id: conversation.id }
                            }
                        }
                    });

                    // Emitir el evento de nuevo mensaje para la respuesta
                    this.chatGateway.handleNewMessage({
                        ...savedResponse,
                        conversationId: conversation.id,
                        timestamp: savedResponse.createdAt.toISOString(),
                        createdAt: savedResponse.createdAt.toISOString()
                    });

                    console.log('Respuesta enviada y guardada:', savedResponse.id);
                } else {
                    console.error('La IA no generó una respuesta válida');
                }
            } catch (aiError) {
                console.error('Error al procesar con IA:', aiError);
                // Enviar mensaje de error al usuario
                const errorMsg = await this.client.sendMessage(
                    msg.from,
                    'Lo siento, estoy experimentando problemas técnicos. Por favor, intenta nuevamente en unos momentos.'
                );
            }

        } catch (error) {
            console.error('Error detallado al procesar mensaje entrante:', error);
            console.error('Stack trace:', error.stack);
        }
    });

    // Evento para cambios en los mensajes
    this.client.on('message_ack', async (msg, ack) => {
        try {
            console.log('=== ACTUALIZACIÓN DE ESTADO DE MENSAJE ===');
            console.log('ID:', msg.id.id);
            console.log('Estado:', ack);

            // Actualizar estado del mensaje en la base de datos
            const status = ack === 3 ? 'read' : ack === 2 ? 'delivered' : ack === 1 ? 'sent' : 'pending';
            
            await this.prisma.message.updateMany({
                where: { whatsappId: msg.id.id },
                data: { status }
            });
        } catch (error) {
            console.error('Error al actualizar estado del mensaje:', error);
        }
    });

    // Evento para cambios en los chats
    this.client.on('chat_update', async (chat) => {
        try {
            console.log('=== ACTUALIZACIÓN DE CHAT ===');
            console.log('ID:', chat.id._serialized);
            
            if (chat.isGroup) return; // Ignorar grupos por ahora

            // Actualizar información del chat
            await this.prisma.conversation.updateMany({
                where: { whatsappId: chat.id._serialized },
                data: {
                    name: chat.name || chat.id.user,
                    status: chat.archived ? 'archived' : 'active'
                }
            });
        } catch (error) {
            console.error('Error al actualizar chat:', error);
        }
    });

    // Evento para mensajes editados
    this.client.on('message_edit', async (msg, newBody, _oldBody) => {
        try {
            console.log('=== MENSAJE EDITADO ===');
            console.log('ID:', msg.id.id);
            console.log('Nuevo contenido:', newBody);

            const existingMessage = await this.prisma.message.findFirst({
                where: { whatsappId: msg.id.id }
            });

            if (existingMessage) {
                const currentMetadata = existingMessage.metadata ? JSON.parse(existingMessage.metadata) : {};
                
                await this.prisma.message.update({
                    where: { id: existingMessage.id },
                    data: { 
                        content: String(newBody),
                        metadata: JSON.stringify({
                            ...currentMetadata,
                            edited: true,
                            editedAt: new Date()
                        })
                    }
                });
            }
        } catch (error) {
            console.error('Error al actualizar mensaje editado:', error);
        }
    });
  }

  private async retryInitialization() {
    if (this.initializationAttempts < this.MAX_RETRIES) {
      console.log(`Reintentando inicialización en ${5} segundos...`);
      setTimeout(() => {
        this.initializeWithRetry();
      }, 5000);
    } else {
      console.error('No se pudo inicializar WhatsApp después de múltiples intentos');
    }
  }

  getStatus() {
    return {
      status: this.status,
      connected: this.status === 'connected',
      qr: this.qr,
      isInitialized: this.isInitialized,
      isConnected: this.isConnected
    };
  }

  getQR() {
    console.log('Solicitando código QR...');
    console.log('Estado actual:', this.status);
    console.log('QR disponible:', this.qr ? 'Sí' : 'No');
    if (this.qr) {
      console.log('Longitud del QR:', this.qr.length);
    }

    if (!this.qr && this.status === 'disconnected' && !this.isInitialized) {
      console.log('No hay QR disponible, intentando reinicializar...');
      this.initializeWithRetry().catch(error => {
        console.error('Error al reinicializar el cliente:', error);
      });
    }

    return {
      qr: this.qr,
      status: this.status,
      isInitialized: this.isInitialized,
      attempts: this.initializationAttempts
    };
  }

  async sendMessage(to: string, content: string) {
    try {
        console.log('Iniciando envío de mensaje a:', to);
        
        // Solo inicializar si realmente es necesario
        if (!this.isConnected) {
            console.log('Cliente no conectado, intentando inicializar...');
            await this.initializeWithRetry();
            // Reducir el tiempo de espera a 500ms
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!this.isConnected) {
                throw new Error('No se pudo establecer la conexión');
            }
        }

        const formattedNumber = this.formatPhoneNumber(to);

        // Crear el mensaje en la base de datos primero con estado 'sending'
        const conversation = await this.prisma.conversation.upsert({
            where: { whatsappId: formattedNumber },
            create: {
                whatsappId: formattedNumber,
                phoneNumber: to,
                name: to,
                status: 'active',
                lastMessage: content,
                lastMessageAt: new Date()
            },
            update: {
                lastMessage: content,
                lastMessageAt: new Date()
            }
        });

        const message = await this.prisma.message.create({
            data: {
                content: content,
                sender: 'bot',
                status: 'sending',
                whatsappId: `pending_${Date.now()}`,
                conversation: {
                    connect: { id: conversation.id }
                }
            }
        });

        // Intentar enviar el mensaje
        let whatsappMsg;
        try {
            whatsappMsg = await this.client.sendMessage(formattedNumber, content);
            console.log('Mensaje enviado exitosamente:', whatsappMsg.id.id);

            // Actualizar el mensaje con el ID de WhatsApp y estado 'sent'
            const updatedMessage = await this.prisma.message.update({
                where: { id: message.id },
                data: {
                    whatsappId: whatsappMsg.id.id,
                    status: 'sent'
                }
            });

            // Emitir solo un evento de mensaje nuevo
            this.chatGateway.handleNewMessage({
                ...updatedMessage,
                conversationId: conversation.id,
                timestamp: updatedMessage.createdAt.toISOString(),
                createdAt: updatedMessage.createdAt.toISOString()
            });

            return updatedMessage;
        } catch (error) {
            // Si falla el envío, actualizar el estado del mensaje a 'error'
            await this.prisma.message.update({
                where: { id: message.id },
                data: { status: 'error' }
            });
            throw error;
        }
    } catch (error) {
        console.error('Error detallado al enviar mensaje:', error);
        throw new Error(`Error al enviar mensaje: ${error.message}`);
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return `${cleanNumber}@c.us`;
  }

  async logout() {
    try {
      console.log('Iniciando proceso de cierre de sesión de WhatsApp...');
      await this.cleanupSession();

      this.systemGateway.broadcastStatus({
        whatsappConnection: 'disconnected',
        aiStatus: 'online',
        aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
        lastUpdate: new Date(),
        qr: null,
        status: this.status,
        error: null,
        isInitialized: this.isInitialized
      });

      return { success: true };
    } catch (error) {
      console.error('Error en el proceso de cierre de sesión:', error);
      throw error;
    }
  }

  async getConversations() {
    try {
      console.log('Obteniendo conversaciones de la base de datos...');
      const conversations = await this.prisma.conversation.findMany({
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              sender: true,
              createdAt: true,
              whatsappId: true
            }
          }
        }
      });

      return conversations.map(conversation => ({
        ...conversation,
        messages: conversation.messages.map(msg => ({
          ...msg,
          timestamp: msg.createdAt.toISOString()
        }))
      }));
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  }

  async sendMedia(to: string, file: MulterFile, caption?: string) {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('El cliente de WhatsApp no está conectado');
      }

      const formattedNumber = this.formatPhoneNumber(to);
      const { MessageMedia } = require('whatsapp-web.js');

      // Crear el objeto MessageMedia desde el archivo
      const media = MessageMedia.fromFilePath(file.path);
      
      // Configurar opciones según el tipo de archivo
      const options: any = {};
      const fileType = file.mimetype.split('/')[0];
      
      if (fileType === 'audio') {
        options.sendAudioAsVoice = true;
      } else if (fileType === 'image' || fileType === 'video') {
        options.caption = caption || file.originalname;
      } else {
        options.sendMediaAsDocument = true;
        options.caption = caption || file.originalname;
      }

      // Enviar el mensaje multimedia
      const msg = await this.client.sendMessage(formattedNumber, media, options);

      // Obtener o crear la conversación
      const chat = await msg.getChat();
      const conversation = await this.prisma.conversation.upsert({
        where: { whatsappId: chat.id._serialized },
        create: {
          whatsappId: chat.id._serialized,
          phoneNumber: to,
          name: chat.name || to,
          status: 'active',
          lastMessage: `📎 ${file.originalname}`,
          lastMessageAt: new Date()
        },
        update: {
          lastMessage: `📎 ${file.originalname}`,
          lastMessageAt: new Date()
        }
      });

      // Guardar el mensaje
      const message = await this.prisma.message.create({
        data: {
          whatsappId: msg.id.id,
          content: `📎 ${file.originalname}`,
          sender: 'bot',
          conversation: {
            connect: { id: conversation.id }
          },
          metadata: JSON.stringify({
            type: fileType,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          })
        }
      });

      // Eliminar el archivo temporal
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return message;
    } catch (error) {
      console.error('Error al enviar archivo:', error);
      // Asegurarse de eliminar el archivo temporal en caso de error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  async sendLocation(to: string, latitude: number, longitude: number, description?: string) {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('El cliente de WhatsApp no está conectado');
      }

      const formattedNumber = this.formatPhoneNumber(to);
      const { Location } = require('whatsapp-web.js');
      
      const location = new Location(latitude, longitude, {
        name: description || 'Ubicación compartida'
      });

      const msg = await this.client.sendMessage(formattedNumber, location);

      // Obtener o crear la conversación
      const chat = await msg.getChat();
      const conversation = await this.prisma.conversation.upsert({
        where: { whatsappId: chat.id._serialized },
        create: {
          whatsappId: chat.id._serialized,
          phoneNumber: to,
          name: chat.name || to,
          status: 'active',
          lastMessage: '📍 Ubicación compartida',
          lastMessageAt: new Date()
        },
        update: {
          lastMessage: '📍 Ubicación compartida',
          lastMessageAt: new Date()
        }
      });

      // Guardar el mensaje
      const message = await this.prisma.message.create({
        data: {
          whatsappId: msg.id.id,
          content: '📍 Ubicación compartida',
          sender: 'bot',
          conversation: {
            connect: { id: conversation.id }
          },
          metadata: JSON.stringify({
            type: 'location',
            latitude,
            longitude,
            description
          })
        }
      });

      return message;
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
      throw error;
    }
  }

  async downloadMedia(messageId: string) {
    try {
      const msg = await this.client.getMessageById(messageId);
      if (!msg) {
        throw new Error('Mensaje no encontrado');
      }

      if (!msg.hasMedia) {
        throw new Error('El mensaje no contiene archivos multimedia');
      }

      const media = await msg.downloadMedia();
      return {
        data: media.data,
        mimetype: media.mimetype,
        filename: media.filename
      };
    } catch (error) {
      console.error('Error al descargar archivo multimedia:', error);
      throw error;
    }
  }

  async reactToMessage(messageId: string, reaction: string) {
    try {
      const msg = await this.client.getMessageById(messageId);
      if (!msg) {
        throw new Error('Mensaje no encontrado');
      }

      await msg.react(reaction);
      return { success: true };
    } catch (error) {
      console.error('Error al reaccionar al mensaje:', error);
      throw error;
    }
  }
} 