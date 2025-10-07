/* frontend/src/services/websocket/socket.manager.ts */
import { io } from 'socket.io-client';
function buildNamespaceUrl(baseUrl) {
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
    constructor() {
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "connectionStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'disconnected'
        });
        Object.defineProperty(this, "statusSubscribers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "attempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "maxAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(this, "currentToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "currentDepartmentId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "namespaceUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: buildNamespaceUrl(import.meta.env.VITE_WS_URL)
        });
        // Initialize handler map keys
        [
            'order.created',
            'order.status.changed',
            'order.approval.requested',
            'order.approval.decided',
        ].forEach((evt) => {
            if (!this.handlers.has(evt))
                this.handlers.set(evt, new Set());
        });
    }
    getConnectionStatus() {
        return this.connectionStatus;
    }
    subscribeStatus(cb) {
        this.statusSubscribers.add(cb);
        // Push initial state
        try {
            cb(this.connectionStatus);
        }
        catch {
            // ignore subscriber errors
        }
        return () => {
            this.statusSubscribers.delete(cb);
        };
    }
    setStatus(status) {
        this.connectionStatus = status;
        this.statusSubscribers.forEach((cb) => {
            try {
                cb(status);
            }
            catch {
                // ignore
            }
        });
    }
    ensureSocketInitialized(token, departmentId) {
        if (this.socket)
            return;
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
    connect(token, departmentId) {
        this.ensureSocketInitialized(token, departmentId);
        // Update auth context jika berubah
        const tokenChanged = this.currentToken !== token;
        const deptChanged = this.currentDepartmentId !== departmentId;
        this.currentToken = token;
        this.currentDepartmentId = departmentId;
        if (!this.socket)
            return;
        // Update auth payload sebelum connect
        this.socket.auth = { token, departmentId };
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
            }
            finally {
                this.setStatus('disconnected');
            }
        }
    }
    /**
     * Register event handler
     */
    on(event, handler) {
        const set = this.handlers.get(event);
        if (!set)
            return;
        set.add(handler);
        // Attach immediately jika sudah connected
        if (this.socket?.connected) {
            this.socket.on(event, handler);
        }
    }
    /**
     * Unregister event handler
     * - Jika handler disediakan, hapus satu handler
     * - Jika tidak, hapus semua handler untuk event tsb.
     */
    off(event, handler) {
        const set = this.handlers.get(event);
        if (!set)
            return;
        if (handler) {
            set.delete(handler);
            if (this.socket) {
                this.socket.off(event, handler);
            }
        }
        else {
            // Remove all for this event
            set.clear();
            if (this.socket) {
                // Remove all listeners for this business event
                this.socket.removeAllListeners(event);
            }
        }
    }
    /**
     * Emit custom event ke server (jika diperlukan di masa depan)
     */
    emit(event, payload) {
        if (!this.socket?.connected)
            return;
        this.socket.emit(event, payload);
    }
    /**
     * Pasang ulang seluruh business handlers dari map ke socket aktif,
     * memastikan tidak terjadi duplikasi.
     */
    reattachBusinessHandlers() {
        if (!this.socket)
            return;
        const businessEvents = [
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
                this.socket.on(evt, fn);
            });
        }
    }
}
export const socketManager = new SocketManager();
export default socketManager;
