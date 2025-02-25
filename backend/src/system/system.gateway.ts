import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WhatsappServiceV2 } from '../whatsapp/whatsapp.service.v2';

interface AuthenticatedSocket extends Socket {
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/system',
  path: '/socket.io/system'
})
export class SystemGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => WhatsappServiceV2))
    private whatsappService: WhatsappServiceV2
  ) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: AuthenticatedSocket) {
    const user = client.user;
    if (!user) {
      client.disconnect();
      return;
    }

    console.log('=== NUEVA CONEXIÓN AL SISTEMA ===', {
      userId: user.id,
      socketId: client.id
    });

    // Enviar estado inicial
    const whatsappStatus = this.whatsappService.getStatus();
    const status = {
      whatsappConnection: whatsappStatus.connected ? 'connected' : 'disconnected',
      aiStatus: 'online',
      aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
      lastUpdate: new Date(),
      qr: whatsappStatus.qr,
      status: whatsappStatus.status,
      isInitialized: whatsappStatus.isInitialized,
      waitingForQR: whatsappStatus.qr !== null
    };

    client.emit('status_update', { status });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log('=== CLIENTE DESCONECTADO DEL SISTEMA ===', {
      socketId: client.id,
      userId: client.user?.id
    });
  }

  // Método para emitir actualizaciones de estado a todos los clientes
  broadcastStatus(status: any) {
    console.log('=== EMITIENDO ACTUALIZACIÓN DE ESTADO ===', status);
    this.server.emit('status_update', { status });
  }
} 