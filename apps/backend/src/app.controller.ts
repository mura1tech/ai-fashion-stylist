import { Controller, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable, from, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeminiService } from './gemini/gemini.service.js';

@Controller('ai')
export class AppController {
  constructor(private readonly geminiService: GeminiService) {}

  @Sse('coordinate-stream')
  streamCoordinate(@Query('prompt') prompt: string): Observable<MessageEvent> {
    return from(this.geminiService.streamCoordinateJson(prompt)).pipe(
      map((chunkText: string) => ({
        // raw chunkText (JSONの断片) をそのまま流す
        data: JSON.stringify({ chunk: chunkText }),
      })),
      catchError((err) => {
        console.error('SSE Stream Error:', err);
        return of({
          data: JSON.stringify({ error: err.message || 'Stream processing error' }),
        });
      }),
    );
  }
}