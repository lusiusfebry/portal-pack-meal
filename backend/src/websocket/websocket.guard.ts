import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<any>();
    const token = this.getTokenFromHandshake(client);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ?? 'supersecretjwt';
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      // Attach payload ke client.data.user untuk diakses oleh Gateway/Handlers
      client.data = client.data ?? {};
      client.data.user = payload;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Ekstrak token dari Socket.IO handshake melalui beberapa lokasi umum:
   * - handshake.auth.token
   * - handshake.headers.authorization: "Bearer <token>"
   * - handshake.query.token
   */
  private getTokenFromHandshake(client: any): string | null {
    // 1) Prefer dari handshake.auth.token (Socket.IO v4)
    const fromAuth = client.handshake?.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.trim().length > 0) {
      return fromAuth.trim();
    }

    // 2) Authorization header (Bearer)
    const authHeader = client.handshake?.headers?.authorization;
    if (typeof authHeader === 'string') {
      const [scheme, value] = authHeader.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && value) {
        return value.trim();
      }
    }

    // 3) Query parameter ?token=...
    const q = client.handshake?.query as Record<string, unknown> | undefined;
    const fromQuery = q?.token;
    if (typeof fromQuery === 'string' && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }
    if (Array.isArray(fromQuery) && fromQuery.length > 0) {
      const first = fromQuery[0];
      if (typeof first === 'string' && first.trim().length > 0) {
        return first.trim();
      }
    }

    return null;
  }
}
