import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d',
          algorithm: 'HS256',
          issuer: 'hotel-chatbot',
          audience: 'hotel-chatbot-client'
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: 'hotel-chatbot',
          audience: 'hotel-chatbot-client'
        }
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, WsJwtGuard, LocalStrategy, RolesGuard],
  exports: [AuthService, JwtModule, UsersModule, WsJwtGuard],
})
export class AuthModule {} 