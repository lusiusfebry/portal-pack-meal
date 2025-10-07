/**
 * TypeScript definitions untuk domain Pesanan (Orders) sesuai kontrak backend DTO/Response.
 * Menyediakan type safety untuk seluruh operasi dan komponen UI terkait pesanan.
 */
/**
 * Enum status pesanan sesuai backend.
 */
export const StatusPesanan = {
    MENUNGGU: 'MENUNGGU',
    IN_PROGRESS: 'IN_PROGRESS',
    READY: 'READY',
    ON_DELIVERY: 'ON_DELIVERY',
    COMPLETE: 'COMPLETE',
    DITOLAK: 'DITOLAK',
    MENUNGGU_PERSETUJUAN: 'MENUNGGU_PERSETUJUAN',
};
/**
 * Runtime value namespace untuk ApprovalStatus agar dapat diimport sebagai nilai:
 * import { ApprovalStatus } from '@/types/order.types'
 * Lalu digunakan: ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, dst.
 */
export const ApprovalStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};
