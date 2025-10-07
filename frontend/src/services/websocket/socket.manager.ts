/* frontend/src/services/websocket/socket.manager.ts */

import { io, type Socket } from 'socket.io-client';
import type {
  NotificationsEventMap,
  NotificationEventHandler,
  WebSocketEventName,
} from '@/types/websocket.types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

function buildNamespaceUrl(baseUrl: string | undefined): string {
  const base = (baseUrl ?? 'http://localhost:3001').replace(/\/+$/, '');
  return `${base}/notifications`;
}

/**
 * SocketManager
 * - Singleton pengelola koneksi Socket.IO (namespace /notifications)
 * - Autentikasi JWT via handshake auth.token
 * - Auto-reconnection dengan batas attempt
 * - Pendaftaran handler event type-safe
 * - API: connect, disconnect, on, off, emit, getConnectionStatus, subscribeStatus
 */
class SocketManager {
  private socket: Socket | null = null;
  private readonly handlers: Map<WebSocketEventName, Set<Function>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusSubscribers: Set<(status: ConnectionStatus) => void> = new Set();

  private attempts = 0;
  private readonly maxAttempts = 5;

  private currentToken: string | undefined;
  private currentDepartmentId: number | undefined;

  private readonly namespaceUrl = buildNamespaceUrl(import.meta.env.VITE_WS_URL);

  constructor() {
    // Initialize handler map keys
    ([
      'order.created',
      'order.status.changed',
      'order.approval.requested',
      'order.approval.decided',
    ] as WebSocketEventName[]).forEach((evt) => {
      if (!this.handlers.has(evt)) this.handlers.set(evt, new Set());
    });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  subscribeStatus(cb: (status: ConnectionStatus) => void): () => void {
    this.statusSubscribers.add(cb);
    // Push initial state
    try {
      cb(this.connectionStatus);
    } catch {
      // ignore subscriber errors
    }
    return () => {
      this.statusSubscribers.delete(cb);
    };
  }

  private setStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.statusSubscribers.forEach((cb) => {
      try {
        cb(status);
      } catch {
        // ignore
      }
    });
  }

  private ensureSocketInitialized(token: string, departmentId?: number) {
    if (this.socket) return;

    this.socket = io(this.namespaceUrl, {
      transports: ['websocket'],
      autoConnect: false,
      withCredentials: true,
      auth: { token, departmentId },
      reconnection: true,
      reconnectionAttempts: this.maxAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Core lifecycle events
    this.socket.on('connect', () => {
      this.attempts = 0;
      this.setStatus('connected');
      // Reattach business listeners freshly to avoid duplicates
      this.reattachBusinessHandlers();
    });

    this.socket.on('disconnect', () => {
      // Note: socket.io will attempt reconnection automatically if enabled
      this.setStatus('disconnected');
    });

    this.socket.on('reconnect_attempt', () => {
      this.attempts += 1;
      this.setStatus('connecting');
    });

    this.socket.on('reconnect_failed', () => {
      this.setStatus('error');
    });

    this.socket.on('connect_error', () => {
      this.setStatus('error');
    });

    this.socket.on('error', () => {
      this.setStatus('error');
    });
  }

  /**
   * Connect (or reconnect) menggunakan accessToken terbaru.
   * - Jika token/department berubah, akan melakukan reconnect ringan.
   * - Hanya memanggil socket.connect() jika belum connected.
   */
  connect(token: string, departmentId?: number) {
    this.ensureSocketInitialized(token, departmentId);

    // Update auth context jika berubah
    const tokenChanged = this.currentToken !== token;
    const deptChanged = this.currentDepartmentId !== departmentId;

    this.currentToken = token;
    this.currentDepartmentId = departmentId;

    if (!this.socket) return;

    // Update auth payload sebelum connect
    (this.socket as any).auth = { token, departmentId };

    if (tokenChanged || deptChanged) {
      // Force a clean reconnect cycle to apply new auth
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.attempts = 0;
    }

    if (!this.socket.connected) {
      this.setStatus('connecting');
      this.socket.connect();
    }
  }

  /**
   * Disconnect dari server WebSocket
   */
  disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } finally {
        this.setStatus('disconnected');
      }
    }
  }

  /**
   * Register event handler
   */
  on<K extends keyof NotificationsEventMap>(
    event: K,
    handler: NotificationEventHandler<K>,
  ) {
    const set = this.handlers.get(event as WebSocketEventName);
    if (!set) return;
    set.add(handler as unknown as Function);

    // Attach immediately jika sudah connected
    if (this.socket?.connected) {
      this.socket.on(event as string, handler as any);
    }
  }

  /**
   * Unregister event handler
   * - Jika handler disediakan, hapus satu handler
   * - Jika tidak, hapus semua handler untuk event tsb.
   */
  off<K extends keyof NotificationsEventMap>(
    event: K,
    handler?: NotificationEventHandler<K>,
  ) {
    const set = this.handlers.get(event as WebSocketEventName);
    if (!set) return;

    if (handler) {
      set.delete(handler as unknown as Function);
      if (this.socket) {
        this.socket.off(event as string, handler as any);
      }
    } else {
      // Remove all for this event
      set.clear();
      if (this.socket) {
        // Remove all listeners for this business event
        this.socket.removeAllListeners(event as string);
      }
    }
  }

  /**
   * Emit custom event ke server (jika diperlukan di masa depan)
   */
  emit(event: string, payload?: unknown) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, payload);
  }

  /**
   * Pasang ulang seluruh business handlers dari map ke socket aktif,
   * memastikan tidak terjadi duplikasi.
   */
  private reattachBusinessHandlers() {
    if (!this.socket) return;

    const businessEvents: WebSocketEventName[] = [
      'order.created',
      'order.status.changed',
      'order.approval.requested',
      'order.approval.decided',
    ];

    // Bersihkan dulu semua listener business di socket
    for (const evt of businessEvents) {
      this.socket.removeAllListeners(evt);
    }

    // Re-attach berdasarkan registry internal
    for (const [evt, set] of this.handlers) {
      set.forEach((fn) => {
        this.socket!.on(evt as string, fn as any);
      });
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;