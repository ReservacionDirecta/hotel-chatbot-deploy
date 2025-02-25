import { Controller, Get, Post, Body, UseGuards, Req, UploadedFile, UseInterceptors, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
    };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Get('conversations')
    async getConversations(@Req() req: AuthenticatedRequest) {
        return this.chatService.getConversations(req.user.userId);
    }

    @Get('messages')
    async getMessages(@Req() req: AuthenticatedRequest) {
        return this.chatService.getMessages(req.user.userId);
    }

    @Get('messages/:conversationId')
    async getConversationMessages(
        @Req() req: AuthenticatedRequest,
        @Param('conversationId') conversationId: string
    ) {
        return this.chatService.getConversationMessages(req.user.userId, conversationId);
    }

    @Post('send')
    async sendMessage(
        @Req() request: AuthenticatedRequest,
        @Body() body: { conversationId: string; message: string; botEnabled?: boolean }
    ) {
        const userId = request.user.userId;
        return this.chatService.sendMessage(
            userId,
            body.conversationId,
            body.message,
            body.botEnabled ?? false
        );
    }

    @Post('upload-audio')
    @UseInterceptors(FileInterceptor('audio'))
    async uploadAudio(@Req() req: AuthenticatedRequest, @UploadedFile() file: Express.Multer.File) {
        return this.chatService.handleAudioMessage(req.user.userId, file);
    }
} 