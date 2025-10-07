import { JwtService } from '@nestjs/jwt';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

import { WsJwtGuard } from './websocket.guard';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { OrderStatusChangedEvent } from '../common/events/order-status-changed.event';
import type { OrderApprovalRequestedEvent } from '../common/events/order-approval-requested.event';
import type { OrderApprovalDecidedEvent } from '../common/events/order-approval-decided.event';

/**
 * WebSocket Gateway untuk real-time notifications.
 *
 * Spesifikasi:
 * - Namespace: /notifications
 * - Guard: WsJwtGuard (autentikasi JWT via handshake)
 * - Lifecycle: init, connection, disconnect
 * - Event listeners: order.created, order.status.changed, order.approval.requested, order.approval.decided
 * - Room management: role, department, user/karyawan
 * - CORS: dikonfigurasi via ConfigService (CORS_ORIGIN)
 *
 * Catatan:
 * - WsJwtGuard akan menempelkan JwtPayload ke client.data.user jika token valid.
 * - DepartmentId diambil dari handshake (auth/query) karena tidak tersedia di JwtPayload.
 *   Klien dapat mengirimkan departmentId melalui:
 *     - socket(auth: { token, departmentId })
 *     - atau query string ?departmentId=<id>
 */
@UseGuards(WsJwtGuard)
@WebSocketGateway({
  namespace: '/notifications',
  transports: ['websocket'],
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server!: Server;

  /**
   * Gateway initialization: refine CORS menggunakan ConfigService.
   */
  afterInit(server: Server): void {
    // CORS sudah dikonfigurasi melalui DedicatedSocketIoAdapter (global adapter).
    // Tidak perlu mutasi runtime terhadap server.opts.
    const origin = this.resolveCorsOrigin();
    this.logger.log(
      `WebSocket initialized: namespace=/notifications, cors=${
        origin === true ? 'true' : JSON.stringify(origin)
      }`,
    );
  }

  /**
   * Ketika client terkoneksi:
   * - Validasi payload user (hasil guard)
   * - Ekstrak departmentId dari handshake
   * - Gabungkan client ke rooms: role, department, user (sub), karyawanId, dan kombinasi dept+role
   */
  handleConnection(client: Socket): void {
    try {
      let user = this.getUserFromClient(client);
      // Fallback manual verification using token from handshake
      if (!user) {
        const token = this.getTokenFromHandshake(client);
        if (token) {
          try {
            const secret =
              this.configService.get<string>('JWT_SECRET') || 'supersecretjwt';
            const payload = this.jwtService.verify<JwtPayload>(token, {
              secret,
            });
            (client as any).data = (client as any).data ?? {};
            (client as any).data.user = payload;
            user = payload;
          } catch (e) {
            this.logger.warn(
              `Unauthorized connection attempt (verify failed) from ${client.id}`,
            );
          }
        }
      }
      if (!user) {
        this.logger.warn(`Unauthorized connection attempt from ${client.id}`);
        client.disconnect(true);
        return;
      }

      const departmentId = this.extractDepartmentId(client);
      this.joinRooms(client, user, departmentId);

      this.logger.log(
        `Client connected: id=${client.id}, user.sub=${user.sub}, role=${user.role}, dept=${
          departmentId ?? 'n/a'
        }`,
      );
    } catch (err) {
      this.logger.error(`Connection error: ${String(err)}`);
      client.disconnect(true);
    }
  }

  /**
   * Lifecycle disconnect.
   */
  handleDisconnect(client: Socket): void {
    const user = this.getUserFromClient(client);
    this.logger.log(
      `Client disconnected: id=${client.id}, user.sub=${user?.sub ?? 'unknown'}`,
    );
    // Socket.IO otomatis melepaskan client dari rooms pada disconnect.
    // Tidak membutuhkan pembersihan manual.
  }

  /**
   * Listener: Pesanan baru dibuat.
   * Audience utama: Dapur (per-department) dan Administrator (global).
   */
  @OnEvent('order.created', { async: true })
  handleOrderCreated(event: any): void {
    try {
      const departmentId: number | undefined = this.safeToNumber(
        event?.departmentId ?? event?.deptId,
      );
      const rooms: string[] = [];
      if (typeof departmentId === 'number') {
        rooms.push(`dept:${departmentId}:role:dapur`);
      }
      rooms.push('role:administrator');

      this.emitToRooms(rooms, 'order.created', event);
      this.logger.debug(
        `Broadcast order.created → rooms=${JSON.stringify(
          rooms,
        )} payload.orderId=${event?.orderId}`,
      );
    } catch (err) {
      this.logger.error(`order.created broadcast failed: ${String(err)}`);
    }
  }

  /**
   * Listener: Perubahan status pesanan.
   * Audience:
   * - MENUNGGU, IN_PROGRESS → Dapur (per-department)
   * - READY → Dapur + Delivery (per-department)
   * - ON_DELIVERY → Delivery (per-department)
   * - COMPLETE, DITOLAK → Administrator (global) + karyawan pemesan (direct)
   * - MENUNGGU_PERSETUJUAN → Administrator (global)
   */
  @OnEvent('order.status.changed', { async: true })
  handleOrderStatusChanged(event: OrderStatusChangedEvent): void {
    try {
      const rooms: string[] = [];
      const deptRoom = `dept:${event.departmentId}`;

      switch (event.newStatus) {
        case 'MENUNGGU':
        case 'IN_PROGRESS': {
          rooms.push(`${deptRoom}:role:dapur`);
          break;
        }
        case 'READY': {
          rooms.push(`${deptRoom}:role:dapur`, `${deptRoom}:role:delivery`);
          break;
        }
        case 'ON_DELIVERY': {
          rooms.push(`${deptRoom}:role:delivery`);
          break;
        }
        case 'COMPLETE': {
          rooms.push('role:administrator');
          break;
        }
        case 'DITOLAK': {
          rooms.push('role:administrator');
          break;
        }
        case 'MENUNGGU_PERSETUJUAN': {
          rooms.push('role:administrator');
          break;
        }
        default: {
          rooms.push('role:administrator');
          break;
        }
      }

      // Selalu informasikan karyawan pemesan secara langsung
      rooms.push(`karyawan:${event.karyawanPemesanId}`);

      this.emitToRooms(rooms, 'order.status.changed', event);
      this.logger.debug(
        `Broadcast order.status.changed → rooms=${JSON.stringify(
          rooms,
        )} orderId=${event.orderId} newStatus=${event.newStatus}`,
      );
    } catch (err) {
      this.logger.error(
        `order.status.changed broadcast failed: ${String(err)}`,
      );
    }
  }

  /**
   * Listener: Permintaan approval oleh dapur (REJECT/EDIT).
   * Audience: Administrator (global) dan Administrator per-department (jika relevan).
   */
  @OnEvent('order.approval.requested', { async: true })
  handleApprovalRequested(event: OrderApprovalRequestedEvent): void {
    try {
      const rooms: string[] = [
        'role:administrator',
        `dept:${event.departmentId}:role:administrator`,
        `karyawan:${event.karyawanPemesanId}`,
      ];
      this.emitToRooms(rooms, 'order.approval.requested', event);
      this.logger.debug(
        `Broadcast order.approval.requested → rooms=${JSON.stringify(
          rooms,
        )} orderId=${event.orderId} type=${event.requestType}`,
      );
    } catch (err) {
      this.logger.error(
        `order.approval.requested broadcast failed: ${String(err)}`,
      );
    }
  }

  /**
   * Listener: Keputusan admin atas permintaan approval dapur.
   * Audience: Dapur (per-department), Administrator (global), dan requester (karyawan/requestedBy).
   */
  @OnEvent('order.approval.decided', { async: true })
  handleApprovalDecided(event: OrderApprovalDecidedEvent): void {
    try {
      const rooms: string[] = [
        `dept:${event.departmentId}:role:dapur`,
        'role:administrator',
        `karyawan:${event.requestedBy}`,
      ];
      this.emitToRooms(rooms, 'order.approval.decided', event);
      this.logger.debug(
        `Broadcast order.approval.decided → rooms=${JSON.stringify(
          rooms,
        )} orderId=${event.orderId} decision=${event.decision}`,
      );
    } catch (err) {
      this.logger.error(
        `order.approval.decided broadcast failed: ${String(err)}`,
      );
    }
  }

  /**
   * Helper: gabungkan client ke rooms berdasarkan role, department, user, karyawan.
   */
  private joinRooms(
    client: Socket,
    user: JwtPayload,
    departmentId?: number,
  ): void {
    const rooms: string[] = [];

    // Room per role (global)
    rooms.push(`role:${user.role}`);

    // Room per user (subject/User.id)
    rooms.push(`user:${user.sub}`);

    // Room per karyawan
    rooms.push(`karyawan:${user.karyawanId}`);

    // Room per department (opsional)
    if (typeof departmentId === 'number') {
      rooms.push(`dept:${departmentId}`);
      // Kombinasi dept+role untuk targeting yang lebih presisi
      rooms.push(`dept:${departmentId}:role:${user.role}`);
    }

    // Gabungkan
    const uniqueRooms = Array.from(new Set(rooms));
    uniqueRooms.forEach((room) => client.join(room));

    this.logger.debug(
      `Joined rooms for client ${client.id}: ${JSON.stringify(uniqueRooms)}`,
    );
  }

  /**
   * Helper: emit ke rooms (union semantics).
   */
  private emitToRooms(
    rooms: string[],
    eventName: string,
    payload: unknown,
  ): void {
    if (!rooms || rooms.length === 0) return;
    const uniqueRooms = Array.from(new Set(rooms));
    this.server.to(uniqueRooms).emit(eventName, payload);
  }

  /**
   * Ambil JwtPayload hasil WsJwtGuard dari client.
   */
  private getUserFromClient(client: Socket): JwtPayload | undefined {
    const data: any = (client as any).data;
    const user: JwtPayload | undefined = data?.user;
    return user;
  }

  /**
   * Fallback: Ekstrak token dari handshake untuk verifikasi manual pada tahap koneksi.
   * Guard WsJwtGuard tidak selalu menempel pada event connection, sehingga kita validasi di sini.
   */
  private getTokenFromHandshake(client: Socket): string | null {
    // 1) Prefer dari handshake.auth.token (Socket.IO v4)
    const fromAuth = (client.handshake as any)?.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.trim().length > 0) {
      return fromAuth.trim();
    }

    // 2) Authorization header (Bearer)
    const authHeader: string | undefined = (client.handshake as any)?.headers
      ?.authorization;
    if (typeof authHeader === 'string') {
      const [scheme, value] = authHeader.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && value) {
        return value.trim();
      }
    }

    // 3) Query parameter ?token=...
    const q: any = client.handshake?.query;
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
  /**
   * Ekstrak departmentId dari handshake (auth atau query).
   */
  private extractDepartmentId(client: Socket): number | undefined {
    const raw =
      (client.handshake as any)?.auth?.departmentId ??
      (client.handshake.query as any)?.departmentId;

    if (Array.isArray(raw)) {
      return this.safeToNumber(raw[0]);
    }
    return this.safeToNumber(raw);
  }

  private safeToNumber(v: unknown): number | undefined {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim().length > 0) {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  }

  /**
   * Resolve CORS origin dari env: CORS_ORIGIN (comma-separated).
   * - '*' atau tidak di-set → true
   * - selain itu → array of origins
   */
  private resolveCorsOrigin(): true | string[] {
    try {
      const rawFromConfig = this.configService?.get<string>('CORS_ORIGIN');
      const raw =
        typeof rawFromConfig === 'string' && rawFromConfig.trim().length > 0
          ? rawFromConfig
          : process.env.CORS_ORIGIN ?? '';

      if (!raw) return true;

      const origins = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return origins.length === 0 || origins.includes('*') ? true : origins;
    } catch {
      // Fallback aman untuk mencegah crash saat bootstrap.
      // Catatan: DedicatedSocketIoAdapter sudah menerapkan CORS di level server.
      return true;
    }
  }
}
