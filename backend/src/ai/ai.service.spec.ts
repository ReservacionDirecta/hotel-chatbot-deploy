import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { SettingsService } from '../settings/settings.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');

describe('AiService', () => {
  let service: AiService;
  let settingsService: SettingsService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  const mockSettingsService = {
    getChatbotSettings: jest.fn().mockResolvedValue({
      botName: 'Test Bot',
      welcomeMessage: 'Welcome',
      language: 'es',
      personality: 'profesional',
      responseTime: 1000,
      isActive: true,
      autoResponse: true,
      maxConversationLength: 50,
    }),
  };

  const mockChat = {
    sendMessage: jest.fn(),
  };

  const mockModel = {
    startChat: jest.fn().mockReturnValue(mockChat),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    settingsService = module.get<SettingsService>(SettingsService);

    // Mock GoogleGenerativeAI
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    }));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateResponse', () => {
    it('should generate a response using Google AI', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Test response'),
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce(mockResponse);

      const response = await service.generateResponse('Test prompt');
      expect(response).toBe('Test response');
    });

    it('should use the configured personality and language', async () => {
      const mockSettings = {
        ...mockSettingsService.getChatbotSettings(),
        personality: 'amigable',
        language: 'en',
      };

      jest.spyOn(settingsService, 'getChatbotSettings')
        .mockResolvedValueOnce(mockSettings);

      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Test response'),
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce(mockResponse);

      await service.generateResponse('Test prompt');

      expect(mockModel.startChat).toHaveBeenCalledWith(expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({
            parts: expect.stringContaining('friendly'),
          }),
        ]),
      }));
    });

    it('should handle Google AI errors gracefully', async () => {
      mockChat.sendMessage.mockRejectedValueOnce(new Error('API Error'));

      const response = await service.generateResponse('Test prompt');
      expect(response).toBe('Lo siento, no pude generar una respuesta.');
    });
  });

  describe('analyzeIntent', () => {
    it('should analyze message intent using Google AI', async () => {
      const mockAnalysis = {
        intent: 'booking',
        confidence: 0.95,
        entities: {
          date: '2024-01-01',
        },
      };

      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockAnalysis)),
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce(mockResponse);

      const result = await service.analyzeIntent('Test message');
      expect(result).toEqual(mockAnalysis);
    });

    it('should use the configured language for system prompt', async () => {
      const mockSettings = {
        ...mockSettingsService.getChatbotSettings(),
        language: 'en',
      };

      jest.spyOn(settingsService, 'getChatbotSettings')
        .mockResolvedValueOnce(mockSettings);

      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('{}'),
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce(mockResponse);

      await service.analyzeIntent('Test message');

      expect(mockModel.startChat).toHaveBeenCalledWith(expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({
            parts: expect.stringContaining('Analyze'),
          }),
        ]),
      }));
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('invalid json'),
        },
      };

      mockChat.sendMessage.mockResolvedValueOnce(mockResponse);

      const result = await service.analyzeIntent('Test message');
      expect(result).toEqual({
        intent: 'unknown',
        confidence: 0,
        entities: {},
      });
    });
  });
}); 