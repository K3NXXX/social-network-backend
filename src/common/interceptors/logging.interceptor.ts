import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		const userAgentString = request.headers['user-agent'] || 'Unknown';
		const userIp = request.headers['x-forwarded-for']?.toString() || request.ip || 'Unknown';
		const userId = (request as any).user?.id || 'Anonymous';
		const method = request.method;
		const url = request.originalUrl;

		return next.handle().pipe(
			tap({
				next: () => {
					if (process.env.NODE_ENV !== 'production') {
						this.logger.log(`User ${userId} (${userIp}) - ${method} ${url} - ${userAgentString}`);
					}
				},
				error: error => {
					const status = error.status || error.statusCode || 500;
					const message = error.message || 'Unknown error';
					if (process.env.NODE_ENV !== 'production') {
						this.logger.error(
							`User ${userId} (${userIp}) - ${method} ${url} - ${status} - ${message}`,
						);
					} else {
						this.logger.error(`User ${userId} - ${method} ${url} - ${status}`);
					}
				},
			}),
		);
	}
}
