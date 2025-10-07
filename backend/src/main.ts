import 'reflect-metadata';
/**
 * Konfigurasi Guards Global — Autentikasi & Otorisasi
 *
 * Ikhtisar:
 * - JwtAuthGuard: Mengamankan semua route secara default menggunakan strategi 'jwt'.
 *   Menghormati dekorator [Public()](backend/src/common/decorators/public.decorator.ts:3) untuk membuka akses tanpa token.
 * - RolesGuard: Memeriksa role dari payload JWT terhadap dekorator [Roles(...)](backend/src/common/decorators/roles.decorator.ts:16)
 *   pada handler atau kelas controller untuk otorisasi berbasis peran.
 *
 * Urutan & Rationale:
 * - JwtAuthGuard dijalankan terlebih dahulu untuk memastikan request memiliki user yang terotentikasi
 *   (kecuali route berlabel Public). Tanpa identitas user, RolesGuard tidak dapat melakukan evaluasi peran.
 * - RolesGuard dijalankan setelah autentikasi sehingga bisa membaca request.user.role dan
 *   memverifikasi apakah role termasuk salah satu yang dipersyaratkan oleh dekorator Roles.
 *
 * Integrasi Global:
 * - Kedua guard dipasang dengan [app.useGlobalGuards()](backend/src/main.ts:18), sehingga berlaku untuk seluruh controller.
 *   Hal ini mengurangi boilerplate pada setiap controller dan memastikan konsistensi security posture.
 *
 * Interaksi dengan CORS, Validation, dan Prefix:
 * - CORS diaktifkan dengan parsing aman untuk daftar origin.
 * - ValidationPipe global mengaktifkan whitelist, transform, dan forbidNonWhitelisted untuk keamanan input.
 * - Prefix 'api' digunakan secara global untuk konsistensi endpoint.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { JwtAuthGuard, RolesGuard } from './common/guards';

// WebSocket dedicated server (Socket.IO) on WS_PORT
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';

// Polyfill: JSON serialization untuk BigInt agar Express/Nest dapat mengirim response yang berisi BigInt
// Menghindari error: "Do not know how to serialize a BigInt"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
/**
 * DedicatedSocketIoAdapter — Mengikat semua WebSocket Gateway ke server Socket.IO terpisah (WS_PORT)
 * Opsi penting:
 * - transports: ['websocket'] untuk koneksi WebSocket murni
 * - CORS dikonfigurasi di level server WS sehingga decorator Gateway tidak perlu memuat CORS
 */
class DedicatedSocketIoAdapter extends IoAdapter {
  constructor(
    app: any,
    private readonly wsPort: number,
    private readonly corsOrigin: true | string[],
  ) {
    super(app);
  }

  // Override pembuatan server IO agar menggunakan port dedicated dan opsi yang diinginkan
  // [DedicatedSocketIoAdapter.createIOServer()](backend/src/main.ts:49)
  override createIOServer(port: number, options?: ServerOptions): any {
    const server = new SocketIOServer(this.wsPort, {
      // Forward opsi dari Nest jika ada (mis. namespace akan diterapkan oleh framework)
      ...options,
      cors: {
        origin: this.corsOrigin,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Authorization',
      },
      transports: ['websocket'],
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get Reflector instance
  const reflector = app.get(Reflector);

  // Apply global authentication guard (JWT)
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Apply global authorization guard (Roles)
  app.useGlobalGuards(new RolesGuard(reflector));

  // CORS configuration (fixed parsing to avoid undefined chaining issues)
  const rawCors = process.env.CORS_ORIGIN;
  const corsOrigin = rawCors
    ? rawCors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['*'];
  app.enableCors({
    origin: corsOrigin.includes('*') ? true : corsOrigin,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Enable cookie parser for WebSocket handshake
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix (simplified/fixed: use constant to avoid undefined env)
  const apiPrefix = 'api';
  app.setGlobalPrefix(apiPrefix);

  // Server port configuration
  const port = parseInt(process.env.PORT || '3000', 10);

  // WebSocket dedicated port configuration
  const wsPort = parseInt(process.env.WS_PORT || '3001', 10);
  const wsCorsOrigin = corsOrigin.includes('*') ? true : corsOrigin;
  // Pasang adapter agar semua Gateway NestJS menggunakan server WS dedicated
  app.useWebSocketAdapter(
    new DedicatedSocketIoAdapter(app, wsPort, wsCorsOrigin),
  );

  // Debug logs for validation
  // eslint-disable-next-line no-console
  console.log('[Bootstrap] CORS origin:', corsOrigin);
  // eslint-disable-next-line no-console
  console.log('[Bootstrap] Global prefix:', apiPrefix);
  // eslint-disable-next-line no-console
  console.log(
    `[Bootstrap] WebSocket server: http://localhost:${wsPort}/notifications (transports=websocket)`,
  );

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
