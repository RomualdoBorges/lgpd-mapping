import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { activityInternalErrorResponse } from './processing-activity-http-contracts.js';

type HttpResponse = {
  status(code: number): HttpResponse;
  json(body: unknown): void;
};

@Catch()
export class ProcessingActivityHttpFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 400 && status < 500) {
        response.status(status).json(exception.getResponse());
        return;
      }
    }
    response.status(500).json(activityInternalErrorResponse);
  }
}
