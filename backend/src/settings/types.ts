export interface SecuritySettings {
  rateLimit: number;
  maxAttempts: number;
  blockDuration: number;
  ipWhitelist: string[];
  enableCaptcha: boolean;
}

export interface NotificationSettings {
  enableEmail: boolean;
  enableWhatsapp: boolean;
  enablePush: boolean;
  notifyOnBooking: boolean;
  notifyOnCheckIn: boolean;
  notifyOnCheckOut: boolean;
  notifyOnMessage: boolean;
}

export interface HotelSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  timezone: string;
  currency: string;
  language: string;
}

export interface ChatbotSettings {
  enableAutoReply: boolean;
  greetingMessage: string;
  workingHours: {
    start: string;
    end: string;
  };
  offlineMessage: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
} 