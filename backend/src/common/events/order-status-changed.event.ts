// Safe fallback types matching Prisma enums. Switch to import from '@prisma/client' when available.
// When Prisma Client exports StatusPesanan, replace this alias with:
//   import type { StatusPesanan } from '@prisma/client';
//   type StatusPesananType = StatusPesanan;
type StatusPesananType =
  | 'MENUNGGU'
  | 'IN_PROGRESS'
  | 'READY'
  | 'ON_DELIVERY'
  | 'COMPLETE'
  | 'DITOLAK'
  | 'MENUNGGU_PERSETUJUAN';

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: number,
    public readonly kodePesanan: string,
    public readonly oldStatus: StatusPesananType | null,
    public readonly newStatus: StatusPesananType,
    public readonly changedBy: number,
    public readonly changedByNik: string,
    public readonly changedByRole: string,
    public readonly departmentId: number,
    public readonly karyawanPemesanId: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
