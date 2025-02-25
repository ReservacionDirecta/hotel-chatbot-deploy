import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      this.logger.log('Validando usuario:', { email });
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        this.logger.warn('Usuario no encontrado:', { email });
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn('Contraseña inválida:', { email });
        return null;
      }

      const { password: _, ...result } = user;
      this.logger.log('Usuario validado:', { email });
      return result;
    } catch (error) {
      this.logger.error('Error al validar usuario:', error);
      throw error;
    }
  }

  async login(loginDto: { email: string; password: string }) {
    try {
      this.logger.log('Iniciando proceso de login:', { email: loginDto.email });
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        this.logger.warn('Credenciales inválidas:', { email: loginDto.email });
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      this.logger.log('Generando token JWT:', { 
        userId: user.id,
        email: user.email
      });

      const token = await this.jwtService.signAsync(payload);

      // Verificar formato del token
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.logger.error('Error al generar token: formato inválido', {
          tokenLength: token.length,
          parts: parts.length
        });
        throw new Error('Error al generar token: formato inválido');
      }

      this.logger.log('Token JWT generado correctamente:', {
        tokenLength: token.length,
        parts: parts.length
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
    } catch (error) {
      this.logger.error('Error en proceso de login:', error);
      throw error;
    }
  }

  async register(registerDto: { email: string; password: string; name: string }) {
    try {
      this.logger.log('Iniciando proceso de registro:', { email: registerDto.email });
      
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email }
      });

      if (existingUser) {
        this.logger.warn('Usuario ya existe:', { email: registerDto.email });
        throw new UnauthorizedException('El usuario ya existe');
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Crear usuario
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name
        }
      });

      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      this.logger.log('Generando token JWT para nuevo usuario:', {
        userId: user.id,
        email: user.email
      });

      const token = await this.jwtService.signAsync(payload);

      // Verificar formato del token
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.logger.error('Error al generar token: formato inválido', {
          tokenLength: token.length,
          parts: parts.length
        });
        throw new Error('Error al generar token: formato inválido');
      }

      this.logger.log('Token JWT generado correctamente:', {
        tokenLength: token.length,
        parts: parts.length
      });

      const { password: _, ...userData } = user;
      return {
        token,
        user: userData
      };
    } catch (error) {
      this.logger.error('Error en proceso de registro:', error);
      throw error;
    }
  }
} 