import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();
		const { method, url, ip } = request;
		const userAgentString = request.headers['user-agent'] || 'Unknown';
		const userIp = ip || 'Unknown';

		const now = Date.now();

		this.logger.log(`🚀 ${method} ${url} - ${userIp} - ${userAgentString}`);

		return next.handle().pipe(
			tap({
				next: data => {
					const responseTime = Date.now() - now;
					this.logger.log(`✅ ${method} ${url} - ${response.statusCode} - ${responseTime}ms`);
				},
				error: error => {
					const responseTime = Date.now() - now;
					this.logger.error(
						`❌ ${method} ${url} - ${error.status || 500} - ${responseTime}ms - ${error.message}`,
					);
				},
			}),
		);
	}
}
