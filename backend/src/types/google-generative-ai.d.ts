declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: { model: string }): GenerativeModel;
  }

  export interface GenerativeModel {
    generateContent(options: {
      contents: Array<{
        parts: Array<{
          text: string;
        }>;
      }>;
    }): Promise<GenerateContentResult>;
  }

  export interface GenerateContentResult {
    response: {
      text(): string;
    };
  }
} 