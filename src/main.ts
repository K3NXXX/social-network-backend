import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  app.use(cookieParser());
  app.enableCors({
    origin: ['*'],
    credentials: true,
  });
  app.setGlobalPrefix('api');

  await app.listen(config.getOrThrow<number>('PORT'));
}

bootstrap();
