import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const cfgRefreshSecret = configService?.get<string>('JWT_REFRESH_SECRET');
const envRefreshSecret = process?.env?.JWT_REFRESH_SECRET;
const jwtRefreshSecret = cfgRefreshSecret ?? envRefreshSecret ?? 'supersecretrefresh';
// eslint-disable-next-line no-console
console.log('[Auth] JwtRefreshStrategy.secret source:', cfgRefreshSecret ? 'config' : envRefreshSecret ? 'env' : 'default');
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.refreshToken as string | null,
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<JwtPayload & { refreshToken: string }> {
    const refreshToken =
      (req?.cookies?.refreshToken as string | undefined) ??
      (req?.body?.refreshToken as string | undefined);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const karyawan = await this.prisma.karyawan.findUnique({
      where: { id: payload.karyawanId },
      include: { user: true },
    });

    if (!karyawan || !karyawan.isActive || !karyawan.user) {
      throw new UnauthorizedException('Invalid refresh token user');
    }

    return { ...payload, refreshToken };
  }
}
