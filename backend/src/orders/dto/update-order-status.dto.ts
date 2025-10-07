import { IsEnum, IsNotEmpty } from 'class-validator';

// Fallback enum konsisten dengan enum Prisma `StatusPesanan` di schema.prisma.
// Ganti ke: `import type { StatusPesanan } from '@prisma/client'` bila Prisma Client mengekspor enum tersebut.
export const StatusPesananEnum = {
  MENUNGGU: 'MENUNGGU',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  ON_DELIVERY: 'ON_DELIVERY',
  COMPLETE: 'COMPLETE',
  DITOLAK: 'DITOLAK',
  MENUNGGU_PERSETUJUAN: 'MENUNGGU_PERSETUJUAN',
} as const;

export type StatusPesananType =
  (typeof StatusPesananEnum)[keyof typeof StatusPesananEnum];

export class UpdateOrderStatusDto {
  @IsEnum(StatusPesananEnum)
  @IsNotEmpty()
  status!: StatusPesananType;
}
