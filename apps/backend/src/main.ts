import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORSの有効化（フロントエンドからのアクセスを許可）
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

await app.listen(3000, '0.0.0.0');
  console.log('🚀 Server is running on http://127.0.0.1:3000');}
bootstrap();