import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      algorithms: ['HS256'],
      issuer: 'hotel-chatbot',
      audience: 'hotel-chatbot-client'
    });
  }

  async validate(payload: any) {
    try {
      this.logger.log('Validando token JWT:', {
        sub: payload.sub,
        email: payload.email
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user) {
        this.logger.warn('Usuario no encontrado:', {
          userId: payload.sub,
          email: payload.email
        });
        throw new UnauthorizedException('Usuario no encontrado');
      }

      this.logger.log('Token validado correctamente:', {
        userId: user.id,
        email: user.email
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    } catch (error) {
      this.logger.error('Error al validar token:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }
}