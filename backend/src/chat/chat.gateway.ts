import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: User;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  conversationId: string;
  createdAt: string;
  metadata?: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  whatsappId: string;
  phoneNumber: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  status: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
  path: '/socket.io/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  private clientConversations: Map<string, Set<string>> = new Map();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      console.log('=== NUEVA CONEXIÓN SOCKET.IO ===');
      console.log('Socket ID:', client.id);
      console.log('Auth token:', client.handshake?.auth?.token);

      const token = client.handshake?.auth?.token;
      
      if (!token) {
        console.log('Cliente intentó conectar sin token');
        client.disconnect();
        return;
      }

      try {
        const decoded = await this.jwtService.verify(token);
        client.user = decoded;
        
        this.connectedClients.set(decoded.id, client);
        this.clientConversations.set(decoded.id, new Set());
        
        console.log(`Cliente autenticado: ${decoded.name} (${decoded.id})`);
        console.log('Total clientes conectados:', this.connectedClients.size);

        client.emit('connection_success', {
          message: 'Conectado exitosamente al chat',
          user: {
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
          },
        });
      } catch (error) {
        console.error('Error al verificar token:', error);
        client.disconnect();
        return;
      }
    } catch (error) {
      console.error('Error en handleConnection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    try {
      console.log('=== DESCONEXIÓN SOCKET.IO ===');
      console.log('Socket ID:', client.id);
      
      const user = client.user;
      if (user) {
        // Dejar todas las salas antes de desconectar
        const rooms = this.clientConversations.get(user.id);
        if (rooms) {
          rooms.forEach(roomId => {
            client.leave(`conversation:${roomId}`);
            console.log(`Cliente ${user.name} abandonó la sala: conversation:${roomId}`);
          });
        }
        
        this.connectedClients.delete(user.id);
        this.clientConversations.delete(user.id);
        console.log(`Cliente desconectado: ${user.name} (${user.id})`);
        console.log('Total clientes conectados:', this.connectedClients.size);
      }
    } catch (error) {
      console.error('Error en handleDisconnect:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string }
  ) {
    try {
      console.log('=== SOLICITUD DE UNIÓN A CONVERSACIÓN ===');
      console.log('Socket ID:', client.id);
      console.log('Datos recibidos:', data);
      
      if (!client.user) {
        console.log('Cliente sin autenticación intentó unirse a una conversación');
        return;
      }

      const roomName = `conversation:${data.conversationId}`;
      
      // Verificar si el cliente ya está en la sala
      const rooms = this.clientConversations.get(client.user.id) || new Set();
      if (!rooms.has(data.conversationId)) {
        await client.join(roomName);
        rooms.add(data.conversationId);
        this.clientConversations.set(client.user.id, rooms);
        console.log(`Cliente ${client.user.name} unido a la sala: ${roomName}`);
        
        // Verificar las salas del cliente
        const clientRooms = Array.from(client.rooms || []);
        console.log('Salas del cliente:', clientRooms);
        
        // Emitir confirmación al cliente
        client.emit('joined_conversation', {
          conversationId: data.conversationId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`Cliente ya está en la sala: ${roomName}`);
      }
    } catch (error) {
      console.error('Error en handleJoinConversation:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string }
  ) {
    console.log('=== SOLICITUD DE ABANDONO DE CONVERSACIÓN ===');
    console.log('Socket ID:', client.id);
    console.log('Datos recibidos:', data);
    
    if (!client.user) return;

    const roomName = `conversation:${data.conversationId}`;
    await client.leave(roomName);
    
    // Actualizar el registro de salas del cliente
    const rooms = this.clientConversations.get(client.user.id);
    if (rooms) {
      rooms.delete(data.conversationId);
      console.log(`Cliente ${client.user.name} abandonó la sala: ${roomName}`);
      
      // Verificar las salas restantes del cliente
      const clientRooms = Array.from(client.rooms || []);
      console.log('Salas restantes del cliente:', clientRooms);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    console.log('Recibiendo mensaje:', {
      from: client.user?.name,
      conversationId: data.conversationId,
      content: data.content
    });

    const user = client.user;
    if (!user) return;

    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const message = await this.prisma.message.create({
        data: {
          content: data.content,
          sender: user.name,
          whatsappId: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          conversation: {
            connect: { id: data.conversationId }
          }
        },
        include: {
          conversation: true
        }
      });

      await this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: {
          lastMessage: data.content,
          lastMessageAt: new Date()
        }
      });

      const messageData = {
        id: message.id,
        content: message.content,
        sender: user.name,
        timestamp: message.createdAt.toISOString(),
        conversation: {
          id: conversation.id,
          name: conversation.name,
          lastMessage: message.content,
          lastMessageAt: message.createdAt.toISOString()
        }
      };

      // Emitir a la sala específica de la conversación
      console.log(`Emitiendo mensaje a la sala: conversation:${data.conversationId}`, messageData);
      this.server.to(`conversation:${data.conversationId}`).emit('new_message', messageData);

      // Emitir actualización de la lista de conversaciones a todos
      this.server.emit('conversation_updated', {
        id: conversation.id,
        lastMessage: message.content,
        lastMessageAt: message.createdAt.toISOString()
      });

      return message;
    } catch (error) {
      console.error('Error al guardar el mensaje:', error);
      client.emit('error', { message: 'Error al enviar el mensaje' });
    }
  }

  // Método para emitir mensajes desde otros servicios
  broadcastMessage(message: any) {
    try {
        console.log('=== BROADCASTING MESSAGE ===', {
            messageId: message.id,
            conversationId: message.conversationId,
            content: message.content,
            sender: message.sender,
            timestamp: message.createdAt || message.timestamp
        });
        
        // Emitir el mensaje a todos los clientes
        this.server.emit('new_message', {
            id: message.id,
            content: message.content,
            sender: message.sender,
            conversationId: message.conversationId,
            createdAt: message.createdAt || message.timestamp,
            timestamp: message.timestamp || message.createdAt,
            metadata: message.metadata
        });

        // Emitir la actualización de la conversación
        this.server.emit('conversation_updated', {
            id: message.conversationId,
            lastMessage: message.content,
            lastMessageAt: message.createdAt || message.timestamp
        });
    } catch (error) {
        console.error('Error al emitir mensaje:', error);
    }
  }

  // Este método maneja los nuevos mensajes
  handleNewMessage(message: Message) {
    try {
        console.log('=== MANEJANDO NUEVO MENSAJE ===', {
            messageId: message.id,
            conversationId: message.conversationId,
            content: message.content,
            sender: message.sender
        });

        // Asegurarse de que el mensaje tenga todos los campos necesarios
        const messageToEmit = {
            ...message,
            timestamp: message.createdAt || message.timestamp || new Date().toISOString(),
            createdAt: message.createdAt || message.timestamp || new Date().toISOString()
        };

        this.broadcastMessage(messageToEmit);
    } catch (error) {
        console.error('Error al manejar nuevo mensaje:', error);
    }
  }

  handleConversationUpdate(conversation: Conversation) {
    try {
        console.log('=== EMITIENDO ACTUALIZACIÓN DE CONVERSACIÓN ===', {
            conversationId: conversation.id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
        });
        
        // Emitir actualización usando un solo tipo de evento
        this.server.emit('conversation_updated', {
            id: conversation.id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            status: conversation.status
        });
    } catch (error) {
        console.error('Error al emitir actualización de conversación:', error);
    }
  }
}
