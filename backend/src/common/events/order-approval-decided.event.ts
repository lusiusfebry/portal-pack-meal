// Safe fallback types matching Prisma enums. Switch to import from '@prisma/client' when available.
// When Prisma Client exports ApprovalStatus, replace this alias with:
//   import type { ApprovalStatus } from '@prisma/client';
//   type ApprovalStatusType = ApprovalStatus;
type ApprovalStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';

export class OrderApprovalDecidedEvent {
  constructor(
    public readonly orderId: number,
    public readonly kodePesanan: string,
    public readonly decision: ApprovalStatusType,
    public readonly decidedBy: number,
    public readonly decidedByNik: string,
    public readonly catatanAdmin: string | null,
    public readonly originalRequest: 'REJECT' | 'EDIT',
    public readonly departmentId: number,
    public readonly requestedBy: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
