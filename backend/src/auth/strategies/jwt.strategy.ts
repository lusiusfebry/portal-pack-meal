import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        (configService?.get<string>('JWT_SECRET') ??
          process?.env?.JWT_SECRET ??
          'supersecretjwt'),
    });

    // Debug log for diagnosis (after super)
    // eslint-disable-next-line no-console
    console.log(
      '[Auth] JwtStrategy DI status:',
      this.configService ? 'present' : 'undefined',
    );
    // eslint-disable-next-line no-console
    const cfgSecret = this.configService?.get<string>('JWT_SECRET');
    const envSecret = process?.env?.JWT_SECRET;
    console.log(
      '[Auth] JwtStrategy secret source:',
      cfgSecret ? 'config' : envSecret ? 'env' : 'default',
    );
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const karyawan = await this.prisma.karyawan.findUnique({
      where: { id: payload.karyawanId },
      include: { user: true },
    });

    if (!karyawan || !karyawan.isActive || !karyawan.user) {
      throw new UnauthorizedException('Invalid token user');
    }

    // Konsistensi payload terhadap data terkini
    if (
      karyawan.nomorIndukKaryawan !== payload.nik ||
      karyawan.user.id !== payload.sub
    ) {
      throw new UnauthorizedException('Token payload mismatch');
    }

    return payload;
  }
}
