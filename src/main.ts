import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	try {
		const app = await NestFactory.create(AppModule, {
			logger: ['error', 'warn', 'log', 'debug', 'verbose'],
		});
		const config = app.get(ConfigService);

		app.setGlobalPrefix('api');

		app.use(cookieParser());

		app.enableCors({
			origin: [
				'http://localhost:5173',
				'https://social-network-frontend-bgrblckeu-k3nxs-projects.vercel.app',
			],
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
		});

		app.useGlobalFilters(new HttpExceptionFilter());
		app.useGlobalInterceptors(new LoggingInterceptor());

		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
				transformOptions: {
					enableImplicitConversion: true,
				},
			}),
		);

		const signals = ['SIGTERM', 'SIGINT'];
		signals.forEach(signal => {
			process.on(signal, async () => {
				logger.log(`Received ${signal}, starting graceful shutdown`);
				await app.close();
				process.exit(0);
			});
		});

		const port = config.getOrThrow<number>('PORT');
		await app.listen(port);

		logger.log(`Environment: ${config.get('NODE_ENV', 'development')}`);
	} catch (error) {
		logger.error('Failed to start application:', error);
		process.exit(1);
	}
}

bootstrap();
