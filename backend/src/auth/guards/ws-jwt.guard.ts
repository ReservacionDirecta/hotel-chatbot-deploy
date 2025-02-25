import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        throw new WsException('Token no proporcionado');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET') || 'your-secret-key',
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new WsException('Usuario no encontrado');
      }

      client['user'] = user;
      return true;
    } catch (err) {
      throw new WsException('Token inválido');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const auth = client.handshake.headers.authorization;
    if (!auth) return undefined;

    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
} 