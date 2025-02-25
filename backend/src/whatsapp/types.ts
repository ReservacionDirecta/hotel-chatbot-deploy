export interface MessageResponse {
  success: boolean;
  queued?: boolean;
  messageId?: string;
  error?: string;
}

export interface QueuedMessage {
  id: string;
  to: string;
  type: 'text' | 'media' | 'template';
  content: any;
  retries: number;
  timestamp: Date;
}

export interface SendMediaMessageDto {
  to: string;
  mediaUrl: string;
  caption?: string;
}

export interface SendTemplateMessageDto {
  to: string;
  templateName: string;
  data: Record<string, string>;
} 