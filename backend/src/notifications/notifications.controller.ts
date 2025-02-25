import { Controller, Get, Param, Post, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { User } from '../decorators/user.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  @ApiOperation({ summary: 'Obtener notificaciones no leídas del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones no leídas' })
  async getUnreadNotifications(@User('id') userId: number) {
    return this.notificationsService.getUnreadNotifications(userId.toString());
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @User('id') userId: number,
  ) {
    return this.notificationsService.markAsRead(notificationId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  async markAllAsRead(@User('id') userId: number) {
    return this.notificationsService.markAllAsRead(userId.toString());
  }
} 