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
		const userIp = request.ip || 'Unknown';
		const userId = (request as any).user?.id || 'Anonymous';

		return next.handle().pipe(
			tap({
				next: data => {
					this.logger.log(`User ${userId} (${userIp}) - ${userAgentString}`);
				},
				error: error => {
					this.logger.error(`User ${userId} - ${error.status || 500} - ${error.message}`);
				},
			}),
		);
	}
}
