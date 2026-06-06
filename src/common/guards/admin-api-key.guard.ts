import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const adminApiKey = this.config.get<string>('ADMIN_API_KEY');
    if (!adminApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header('x-admin-api-key');

    if (!providedKey || providedKey !== adminApiKey) {
      throw new UnauthorizedException('Invalid or missing admin API key');
    }

    return true;
  }
}
