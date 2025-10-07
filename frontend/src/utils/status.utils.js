/**
 * Utilitas status pesanan untuk UI.
 * Diselaraskan dengan enum backend:
 * - StatusPesanan: lihat backend/prisma/schema.prisma
 */
import { StatusPesanan } from '@/types/order.types';
/**
 * Label human-readable untuk setiap status.
 */
export function getStatusLabel(status) {
    switch (status) {
        case StatusPesanan.MENUNGGU:
            return 'Menunggu';
        case StatusPesanan.IN_PROGRESS:
            return 'Diproses';
        case StatusPesanan.READY:
            return 'Siap';
        case StatusPesanan.ON_DELIVERY:
            return 'Diantar';
        case StatusPesanan.COMPLETE:
            return 'Selesai';
        case StatusPesanan.DITOLAK:
            return 'Ditolak';
        case StatusPesanan.MENUNGGU_PERSETUJUAN:
            return 'Menunggu Persetujuan';
        default:
            return status;
    }
}
/**
 * Pemetaan status → variant badge.
 */
export function getStatusBadgeVariant(status) {
    switch (status) {
        case StatusPesanan.COMPLETE:
            return 'success';
        case StatusPesanan.DITOLAK:
            return 'error';
        case StatusPesanan.MENUNGGU:
        case StatusPesanan.MENUNGGU_PERSETUJUAN:
            return 'warning';
        case StatusPesanan.IN_PROGRESS:
        case StatusPesanan.READY:
        case StatusPesanan.ON_DELIVERY:
            return 'info';
        default:
            return 'neutral';
    }
}
/**
 * Kelas Tailwind untuk tekstual status (warna sesuai design system).
 * Gunakan pada teks/ikon status jika tidak memakai Badge.
 */
export function getStatusTextClass(status) {
    switch (status) {
        case StatusPesanan.COMPLETE:
            return 'text-emerald-600 dark:text-emerald-400';
        case StatusPesanan.DITOLAK:
            return 'text-red-600 dark:text-red-400';
        case StatusPesanan.MENUNGGU:
        case StatusPesanan.MENUNGGU_PERSETUJUAN:
            return 'text-amber-600 dark:text-amber-400';
        case StatusPesanan.IN_PROGRESS:
            return 'text-sky-600 dark:text-sky-400';
        case StatusPesanan.READY:
            return 'text-violet-600 dark:text-violet-400';
        case StatusPesanan.ON_DELIVERY:
            return 'text-blue-600 dark:text-blue-400';
        default:
            return 'text-slate-600 dark:text-slate-300';
    }
}
/**
 * Status terminal (tidak ada transisi lebih lanjut).
 */
export function isTerminalStatus(status) {
    return (status === StatusPesanan.COMPLETE ||
        status === StatusPesanan.DITOLAK);
}
/**
 * Status yang menandakan perlu persetujuan admin.
 */
export function isAwaitingApproval(status) {
    return status === StatusPesanan.MENUNGGU_PERSETUJUAN;
}
/**
 * Daftar transisi status yang diizinkan berdasarkan peran.
 * Catatan:
 * - Implementasi ini merupakan pedoman UI; validasi otoritatif ada di backend.
 */
export function getAllowedTransitionsByRole(role, current) {
    if (isTerminalStatus(current))
        return [];
    switch (role) {
        case 'dapur': {
            switch (current) {
                case StatusPesanan.MENUNGGU:
                    return [StatusPesanan.IN_PROGRESS, StatusPesanan.MENUNGGU_PERSETUJUAN];
                case StatusPesanan.IN_PROGRESS:
                    return [StatusPesanan.READY, StatusPesanan.MENUNGGU_PERSETUJUAN];
                case StatusPesanan.READY:
                    return [StatusPesanan.ON_DELIVERY, StatusPesanan.MENUNGGU_PERSETUJUAN];
                case StatusPesanan.MENUNGGU_PERSETUJUAN:
                    return []; // menunggu keputusan admin
                default:
                    return [];
            }
        }
        case 'delivery': {
            switch (current) {
                case StatusPesanan.READY:
                    return [StatusPesanan.ON_DELIVERY];
                case StatusPesanan.ON_DELIVERY:
                    return [StatusPesanan.COMPLETE];
                default:
                    return [];
            }
        }
        case 'administrator': {
            // Admin bisa melakukan override jika diperlukan (kebijakan).
            switch (current) {
                case StatusPesanan.MENUNGGU:
                    return [StatusPesanan.IN_PROGRESS, StatusPesanan.READY, StatusPesanan.MENUNGGU_PERSETUJUAN];
                case StatusPesanan.IN_PROGRESS:
                    return [StatusPesanan.READY, StatusPesanan.MENUNGGU_PERSETUJUAN];
                case StatusPesanan.READY:
                    return [StatusPesanan.ON_DELIVERY, StatusPesanan.COMPLETE];
                case StatusPesanan.ON_DELIVERY:
                    return [StatusPesanan.COMPLETE];
                case StatusPesanan.MENUNGGU_PERSETUJUAN:
                    // keputusan admin akan mengubah status menjadi COMPLETE/DITOLAK/MENUNGGU (sesuai alur backend)
                    return [StatusPesanan.DITOLAK, StatusPesanan.MENUNGGU];
                default:
                    return [];
            }
        }
        default:
            return [];
    }
}
