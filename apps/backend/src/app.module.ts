import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GeminiService } from './gemini/gemini.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env を読み込む
  ],
  controllers: [AppController],
  providers: [AppService, GeminiService],
})
export class AppModule {}
