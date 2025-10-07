import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';

// Fallback enum konsisten dengan enum Prisma `ApprovalStatus` di schema.prisma.
// Ganti ke: `import type { ApprovalStatus } from '@prisma/client'` bila Prisma Client mengekspor enum tersebut.
export const ApprovalStatusEnum = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatusType =
  (typeof ApprovalStatusEnum)[keyof typeof ApprovalStatusEnum];

export class ApproveRejectOrderDto {
  @IsEnum(ApprovalStatusEnum)
  @IsNotEmpty()
  decision!: ApprovalStatusType;

  @IsString()
  @IsOptional()
  catatanAdmin?: string;
}
