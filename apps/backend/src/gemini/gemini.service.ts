import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

// レスポンスの型定義
export interface FashionCoordinate {
  title: string;
  concept: string;
  items: {
    category: string;
    description: string;
    color: string;
  }[];
  advice: string;
}

@Injectable()
export class GeminiService implements OnModuleInit {
  private ai!: GoogleGenAI;

  onModuleInit() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ [ERROR] GEMINI_API_KEY が環境変数に設定されていません。');
      throw new Error('GEMINI_API_KEY is missing in environment variables.');
    }

    // apiKey を明示的に指定して初期化
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * プロンプトから構造化されたファッションコーディネート情報を生成する (一括取得用)
   */
  async generateCoordinate(prompt: string): Promise<FashionCoordinate> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `以下の要望に基づいたコーディネート案を作成してください:\n${prompt}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              concept: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    color: { type: Type.STRING },
                  },
                  required: ['category', 'description', 'color'],
                },
              },
              advice: { type: Type.STRING },
            },
            required: ['title', 'concept', 'items', 'advice'],
          },
        },
      });

      if (!response.text) {
        throw new Error('Gemini API returned empty response.');
      }

      const data: FashionCoordinate = JSON.parse(response.text);
      return data;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new InternalServerErrorException('AIデータの生成に失敗しました。');
    }
  }

  /**
   * JSON 構造化データをストリーミング出力する
   */
  async *streamCoordinateJson(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `以下の要望に基づいたコーディネート案を作成してください:\n${prompt}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              concept: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    color: { type: Type.STRING },
                  },
                  required: ['category', 'description', 'color'],
                },
              },
              advice: { type: Type.STRING },
            },
            required: ['title', 'concept', 'items', 'advice'],
          },
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error('Gemini Stream Error:', error);
      throw new InternalServerErrorException('JSONストリーミング中にエラーが発生しました。');
    }
  }
}