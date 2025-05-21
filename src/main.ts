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
<<<<<<< HEAD
  app.setGlobalPrefix('api');
  
=======

>>>>>>> 1a4a9c694734123ddd23690f782d858a48689c69
  await app.listen(config.getOrThrow<number>("PORT"));
}

bootstrap();