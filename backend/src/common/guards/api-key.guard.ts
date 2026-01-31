import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Simple API key authentication guard
 * Validates the API key provided in the X-API-Key header
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return this.validateApiKey(request);
  }

  private validateApiKey(request: Request): boolean {
    // Get API key from environment
    const validApiKey = this.configService.get<string>('API_KEY');

    // If no API key is configured, bypass validation in development
    if (!validApiKey && this.configService.get<string>('NODE_ENV') === 'development') {
      return true;
    }

    // Get API key from request header
    const apiKey = request.header('X-API-Key');

    // Validate API key
    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}