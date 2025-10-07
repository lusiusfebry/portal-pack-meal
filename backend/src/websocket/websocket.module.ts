import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { NotificationsGateway } from './websocket.gateway';
import { WsJwtGuard } from './websocket.guard';

/**
 * WebSocketModule
 * - Mendaftarkan NotificationsGateway dan WsJwtGuard
 * - Mengonfigurasi JwtModule secara async menggunakan ConfigService (secret & expiry dari env)
 * - Mengekspor NotificationsGateway agar dapat digunakan di module lain
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'supersecretjwt',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
  ],
  providers: [NotificationsGateway, WsJwtGuard],
  exports: [NotificationsGateway],
})
export class WebSocketModule {}
