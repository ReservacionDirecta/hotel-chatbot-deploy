export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  messages: Message[];
  summary: string;
  tags: string[];
}

export interface CommonQuestion {
  question: string;
  answer: string;
  frequency: number;
}

export interface HotelInfo {
  amenities: string[];
  policies: string[];
  roomTypes: string[];
  services: string[];
}

export interface ProcessedContent {
  conversations: Conversation[];
  extractedInfo: {
    commonQuestions: CommonQuestion[];
    hotelInfo: HotelInfo;
  };
}
