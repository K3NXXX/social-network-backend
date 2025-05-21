import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = app.get(ConfigService);
  app.enableCors({
    origin: ['*'],
    credentials: true,
  });
  
  await app.listen(config.getOrThrow<number>("PORT"));
}

bootstrap();
