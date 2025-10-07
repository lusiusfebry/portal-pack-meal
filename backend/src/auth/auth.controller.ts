import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

import { LoginAliasPipe } from '../common/pipes/alias-transform.pipes';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(LoginAliasPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }> {
    // Debug: DI status for AuthController sebelum memanggil AuthService.login
    // eslint-disable-next-line no-console
    console.log('[Debug] AuthController.login DI check:', {
      hasAuthService: !!this.authService,
      authServiceType: this.authService?.constructor?.name,
    });

    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);

    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: sevenDaysMs,
      path: '/',
    });

    // Kembalikan accessToken + refreshToken di body untuk kompatibilitas alat pengujian eksternal
    return { accessToken, refreshToken, user };
  }

  @Public()
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user.sub,
      user.karyawanId,
    );

    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: sevenDaysMs,
      path: '/',
    });

    // Kembalikan pasangan token baru (access + refresh) agar kompatibel dengan test eksternal
    return { accessToken, refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Roles('administrator', 'employee', 'dapur', 'delivery')
  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<Record<string, unknown>> {
    return this.authService.getUserProfile(user.sub, user.karyawanId);
  }
}
