import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(ConfigService);
    
    // Configuración global
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    // Configuración de límites de tamaño
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    // Middleware de seguridad
    app.use(cookieParser());
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }));

    // Configuración CORS
    app.enableCors({
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
      maxAge: 3600
    });

    // Puerto de escucha
    const port = configService.get('PORT') || 4000;
    
    // Asegurarse de que el puerto esté disponible
    await app.listen(port, '0.0.0.0', () => {
      console.log(`=== SERVIDOR INICIADO ===`);
      console.log(`Servidor escuchando en: http://localhost:${port}`);
      console.log(`API disponible en: http://localhost:${port}/api`);
      console.log(`CORS habilitado para: http://localhost:3000`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa no manejada:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  process.exit(1);
});

bootstrap();
