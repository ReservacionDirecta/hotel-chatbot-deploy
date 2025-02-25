import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Post(':id/messages')
  createMessage(
    @Param('id') id: string,
    @Body() data: { content: string; sender: string },
  ) {
    return this.conversationsService.createMessage({
      ...data,
      conversationId: id,
    });
  }
} 