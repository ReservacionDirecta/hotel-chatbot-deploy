import { Controller, Post, Body, HttpException, HttpStatus, Logger, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      this.logger.log('Intento de login:', { email: loginDto.email });
      const result = await this.authService.login(loginDto);
      
      if (!result || !result.token) {
        this.logger.error('Error en login: Token no generado');
        throw new HttpException(
          'Error al generar el token',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Verificar formato del token
      const parts = result.token.split('.');
      if (parts.length !== 3) {
        this.logger.error('Error en login: Formato de token inválido', {
          token: result.token.substring(0, 10) + '...',
          parts: parts.length
        });
        throw new HttpException(
          'Error al generar el token: formato inválido',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log('Login exitoso:', { 
        email: loginDto.email,
        tokenLength: result.token.length,
        tokenParts: parts.length
      });

      return result;
    } catch (error) {
      this.logger.error('Error en login:', error);
      throw new HttpException(
        error.message || 'Error al iniciar sesión',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; name: string }) {
    try {
      this.logger.log('Intento de registro:', { email: registerDto.email });
      const result = await this.authService.register(registerDto);
      
      if (!result || !result.token) {
        this.logger.error('Error en registro: Token no generado');
        throw new HttpException(
          'Error al generar el token',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Verificar formato del token
      const parts = result.token.split('.');
      if (parts.length !== 3) {
        this.logger.error('Error en registro: Formato de token inválido', {
          token: result.token.substring(0, 10) + '...',
          parts: parts.length
        });
        throw new HttpException(
          'Error al generar el token: formato inválido',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log('Registro exitoso:', { 
        email: registerDto.email,
        tokenLength: result.token.length,
        tokenParts: parts.length
      });

      return result;
    } catch (error) {
      this.logger.error('Error en registro:', error);
      throw new HttpException(
        error.message || 'Error al registrar usuario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: 'Sesión cerrada correctamente' };
  }
} 