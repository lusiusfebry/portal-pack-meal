import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../common/services/audit-trail.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  RejectOrderDto,
  EditOrderDto,
  ApproveRejectOrderDto,
  QueryOrdersDto,
} from './dto';
import {
  OrderStatusChangedEvent,
  OrderApprovalRequestedEvent,
  OrderApprovalDecidedEvent,
} from '../common/events';

// Safe fallback string union types matching Prisma enums (switch to imports from '@prisma/client' when available)
type StatusPesananFallback =
  | 'MENUNGGU'
  | 'IN_PROGRESS'
  | 'READY'
  | 'ON_DELIVERY'
  | 'COMPLETE'
  | 'DITOLAK'
  | 'MENUNGGU_PERSETUJUAN';

type ApprovalStatusFallback = 'PENDING' | 'APPROVED' | 'REJECTED';
type RoleAccessFallback = 'administrator' | 'employee' | 'dapur' | 'delivery';

type StatusType = StatusPesananFallback;
type ApprovalType = ApprovalStatusFallback;
type RoleAccessType = RoleAccessFallback;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * generateOrderCode
   * Format: PM-YYYYMMDD-XXX
   * Count orders for given date and generate a padded 3-digit sequence.
   */
  async generateOrderCode(tanggalPesanan: Date): Promise<string> {
    const normalized = this.normalizeDateOnly(tanggalPesanan);

    const totalForDay = await this.prisma.pesanan.count({
      where: { tanggalPesanan: normalized },
    });

    const seq = (totalForDay + 1).toString().padStart(3, '0');

    const yyyy = normalized.getFullYear();
    const mm = (normalized.getMonth() + 1).toString().padStart(2, '0');
    const dd = normalized.getDate().toString().padStart(2, '0');

    return `PM-${yyyy}${mm}${dd}-${seq}`;
  }

  /**
   * create
   * - Fetch karyawan with department
   * - Parse tanggalPesanan or use today's date
   * - Generate order code
   * - Fetch shift for logging
   * - Create order dengan status MENUNGGU
   * - Log audit trail
   * - Emit 'order.created' event (string-based)
   */
  async create(karyawanId: number, createOrderDto: CreateOrderDto) {
    const karyawan = await this.prisma.karyawan.findUnique({
      where: { id: karyawanId },
      include: { department: true },
    });

    if (!karyawan) {
      throw new NotFoundException('Karyawan not found');
    }
    if (!karyawan.isActive) {
      throw new ForbiddenException('Inactive karyawan cannot create orders');
    }

    const tanggalPesanan = createOrderDto.tanggalPesanan
      ? new Date(createOrderDto.tanggalPesanan)
      : new Date();
    const tanggalNormalized = this.normalizeDateOnly(tanggalPesanan);

    const kodePesanan = await this.generateOrderCode(tanggalNormalized);

    const shift = await this.prisma.shift.findUnique({
      where: { id: createOrderDto.shiftId },
    });
    if (!shift) {
      throw new BadRequestException('Shift not found');
    }

    // Ensure department is present (Pesanan.departmentPemesanId is required)
    const departmentIdForOrder =
      typeof karyawan.departmentId === 'number'
        ? karyawan.departmentId
        : karyawan.department?.id;
    if (typeof departmentIdForOrder !== 'number') {
      throw new BadRequestException('Karyawan has no department assigned');
    }
    const created = await this.prisma.pesanan.create({
      data: {
        kodePesanan,
        karyawanPemesanId: karyawan.id,
        departmentPemesanId: departmentIdForOrder,
        shiftId: createOrderDto.shiftId,
        jumlahPesanan: createOrderDto.jumlahPesanan,
        statusPesanan: 'MENUNGGU' as any,
        tanggalPesanan: tanggalNormalized,
      },
      include: { pemesan: true, departemen: true, shift: true },
    });

    await this.auditTrail.logOrderCreated(
      karyawanId,
      kodePesanan,
      createOrderDto.jumlahPesanan,
      shift.namaShift,
    );

    // Emit a simple creation event for listeners that care about new orders
    this.eventEmitter.emit('order.created', {
      orderId: created.id,
      kodePesanan,
      karyawanPemesanId: created.karyawanPemesanId,
      departmentId: created.departmentPemesanId,
      shiftId: created.shiftId,
      jumlahPesanan: created.jumlahPesanan,
      tanggalPesanan: created.tanggalPesanan,
      timestamp: new Date(),
    });

    return created;
  }

  /**
   * findAll
   * - Role-based where clause
   * - Apply filters from queryDto
   * - Implement pagination
   * - Return { data, total, page, limit, totalPages }
   */
  async findAll(
    karyawanId: number,
    role: RoleAccessType,
    queryDto: QueryOrdersDto,
  ) {
    const {
      status,
      departmentId,
      shiftId,
      tanggalMulai,
      tanggalAkhir,
      requiresApproval,
      page = 1,
      limit = 10,
    } = queryDto;

    // Base where by role
    let baseWhere: any = {};
    if (role === 'employee') {
      baseWhere = { karyawanPemesanId: karyawanId };
    } else if (role === 'dapur') {
      baseWhere = {
        statusPesanan: {
          in: ['MENUNGGU', 'IN_PROGRESS', 'MENUNGGU_PERSETUJUAN'] as any,
        },
      };
    } else if (role === 'delivery') {
      baseWhere = { statusPesanan: { in: ['READY', 'ON_DELIVERY'] as any } };
    } else if (role === 'administrator') {
      baseWhere = {};
    } else {
      // Unknown role: restrict to none
      baseWhere = { karyawanPemesanId: -1 };
    }

    // Additional filters
    const andFilters: any[] = [];

    if (status) {
      andFilters.push({ statusPesanan: status as any });
    }
    if (typeof departmentId === 'number') {
      andFilters.push({ departmentPemesanId: departmentId });
    }
    if (typeof shiftId === 'number') {
      andFilters.push({ shiftId });
    }
    if (typeof requiresApproval === 'boolean') {
      andFilters.push({ requiresApproval });
    }

    // Date range
    if (tanggalMulai || tanggalAkhir) {
      const gte = tanggalMulai
        ? this.normalizeDateOnly(new Date(tanggalMulai))
        : undefined;
      const lte = tanggalAkhir
        ? this.normalizeDateOnly(new Date(tanggalAkhir))
        : undefined;
      andFilters.push({
        tanggalPesanan: {
          ...(gte ? { gte } : {}),
          ...(lte ? { lte } : {}),
        },
      });
    }

    const where: any =
      andFilters.length > 0 ? { AND: [baseWhere, ...andFilters] } : baseWhere;

    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this.prisma.pesanan.findMany({
        where,
        orderBy: { waktuDibuat: 'desc' },
        skip,
        take,
        include: { pemesan: true, departemen: true, shift: true },
      }),
      this.prisma.pesanan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  /**
   * findOne
   * - Query order with relations
   * - Access check: employee can only access their own orders
   */
  async findOne(id: number, karyawanId: number, role: RoleAccessType) {
    const order = await this.prisma.pesanan.findUnique({
      where: { id },
      include: { pemesan: true, departemen: true, shift: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === 'employee' && order.karyawanPemesanId !== karyawanId) {
      throw new ForbiddenException('Access denied to another employee’s order');
    }

    return order;
  }

  /**
   * updateStatus
   * - Validate role-based allowed transitions
   * - Update appropriate timestamp field
   * - Log audit
   * - Emit OrderStatusChangedEvent
   */
  async updateStatus(
    id: number,
    karyawanId: number,
    role: RoleAccessType,
    updateStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.pesanan.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const actor = await this.prisma.karyawan.findUnique({
      where: { id: karyawanId },
    });
    if (!actor) {
      throw new NotFoundException('Karyawan not found');
    }

    const oldStatus = order.statusPesanan as StatusType;
    const newStatus = updateStatusDto.status as StatusType;

    if (oldStatus === newStatus) {
      throw new BadRequestException('Status is unchanged');
    }

    if (!this.isTransitionAllowed(role, oldStatus, newStatus)) {
      throw new ForbiddenException('Invalid status transition for role');
    }

    const timestampField = this.getTimestampFieldForStatus(newStatus);

    const data: any = {
      statusPesanan: newStatus as any,
    };
    if (timestampField) {
      data[timestampField] = new Date();
    }

    const updated = await this.prisma.pesanan.update({
      where: { id },
      data,
      include: { pemesan: true, departemen: true, shift: true },
    });

    await this.auditTrail.logOrderStatusChanged(
      karyawanId,
      updated.kodePesanan,
      oldStatus as string,
      newStatus as string,
    );

    this.eventEmitter.emit(
      'order.status.changed',
      new OrderStatusChangedEvent(
        updated.id,
        updated.kodePesanan,
        oldStatus ?? null,
        newStatus,
        actor.id,
        actor.nomorIndukKaryawan,
        String(actor.roleAccess),
        updated.departmentPemesanId,
        updated.karyawanPemesanId,
        new Date(),
      ),
    );

    return updated;
  }

  /**
   * requestRejection
   * - Validate current order status
   * - Store original quantity
   * - Update to MENUNGGU_PERSETUJUAN with requiresApproval and PENDING
   * - Log & Emit OrderApprovalRequestedEvent (REJECT)
   */
  async requestRejection(
    id: number,
    dapurKaryawanId: number,
    rejectDto: RejectOrderDto,
  ) {
    const order = await this.prisma.pesanan.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['COMPLETE', 'DITOLAK'].includes(order.statusPesanan)) {
      throw new BadRequestException('Order cannot be rejected at this status');
    }
    if (order.statusPesanan === 'MENUNGGU_PERSETUJUAN') {
      throw new BadRequestException('Order already pending approval');
    }

    const dapur = await this.prisma.karyawan.findUnique({
      where: { id: dapurKaryawanId },
    });
    if (!dapur) {
      throw new NotFoundException('Karyawan (dapur) not found');
    }

    const oldStatus = order.statusPesanan as StatusType;

    const updated = await this.prisma.pesanan.update({
      where: { id },
      data: {
        jumlahPesananAwal: order.jumlahPesanan,
        statusPesanan: 'MENUNGGU_PERSETUJUAN' as any,
        requiresApproval: true,
        approvalStatus: 'PENDING' as any,
        catatanDapur: rejectDto.catatanDapur,
      },
      include: { pemesan: true, departemen: true, shift: true },
    });

    await this.auditTrail.logOrderStatusChanged(
      dapurKaryawanId,
      updated.kodePesanan,
      oldStatus as string,
      'MENUNGGU_PERSETUJUAN',
    );

    await this.auditTrail.logOrderRejectionRequested(
      dapurKaryawanId,
      updated.kodePesanan,
      rejectDto.catatanDapur,
    );

    this.eventEmitter.emit(
      'order.approval.requested',
      new OrderApprovalRequestedEvent(
        updated.id,
        updated.kodePesanan,
        'REJECT',
        dapurKaryawanId,
        dapur.nomorIndukKaryawan,
        rejectDto.catatanDapur,
        updated.jumlahPesananAwal ?? updated.jumlahPesanan,
        updated.departmentPemesanId,
        updated.karyawanPemesanId,
        undefined,
      ),
    );

    return updated;
  }

  /**
   * requestEdit
   * - Validate new quantity differs
   * - Store original quantity, set new jumlahPesanan
   * - Update approval flags and status
   * - Log & Emit OrderApprovalRequestedEvent (EDIT)
   */
  async requestEdit(
    id: number,
    dapurKaryawanId: number,
    editDto: EditOrderDto,
  ) {
    const order = await this.prisma.pesanan.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['COMPLETE', 'DITOLAK'].includes(order.statusPesanan)) {
      throw new BadRequestException('Order cannot be edited at this status');
    }
    if (order.statusPesanan === 'MENUNGGU_PERSETUJUAN') {
      throw new BadRequestException('Order already pending approval');
    }

    const newQty = editDto.jumlahPesananBaru;
    if (newQty === order.jumlahPesanan) {
      throw new BadRequestException('New quantity must differ from current');
    }

    const dapur = await this.prisma.karyawan.findUnique({
      where: { id: dapurKaryawanId },
    });
    if (!dapur) {
      throw new NotFoundException('Karyawan (dapur) not found');
    }

    const oldStatus = order.statusPesanan as StatusType;

    const updated = await this.prisma.pesanan.update({
      where: { id },
      data: {
        jumlahPesananAwal: order.jumlahPesanan,
        jumlahPesanan: newQty,
        statusPesanan: 'MENUNGGU_PERSETUJUAN' as any,
        requiresApproval: true,
        approvalStatus: 'PENDING' as any,
        catatanDapur: editDto.catatanDapur,
      },
      include: { pemesan: true, departemen: true, shift: true },
    });

    await this.auditTrail.logOrderStatusChanged(
      dapurKaryawanId,
      updated.kodePesanan,
      oldStatus as string,
      'MENUNGGU_PERSETUJUAN',
    );

    await this.auditTrail.logOrderEditRequested(
      dapurKaryawanId,
      updated.kodePesanan,
      order.jumlahPesanan,
      newQty,
      editDto.catatanDapur,
    );

    this.eventEmitter.emit(
      'order.approval.requested',
      new OrderApprovalRequestedEvent(
        updated.id,
        updated.kodePesanan,
        'EDIT',
        dapurKaryawanId,
        dapur.nomorIndukKaryawan,
        editDto.catatanDapur,
        updated.jumlahPesananAwal ?? order.jumlahPesanan,
        updated.departmentPemesanId,
        updated.karyawanPemesanId,
        newQty,
      ),
    );

    return updated;
  }

  /**
   * approveRejectRequest
   * - Validate approval flags
   * - Determine original request type (REJECT | EDIT)
   * - Apply decision rules
   * - Log & Emit OrderApprovalDecidedEvent
   */
  async approveRejectRequest(
    id: number,
    adminId: number,
    approveRejectDto: ApproveRejectOrderDto,
  ) {
    const order = await this.prisma.pesanan.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const admin = await this.prisma.karyawan.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Karyawan (admin) not found');
    }

    if (
      !order.requiresApproval ||
      order.approvalStatus !== ('PENDING' as any)
    ) {
      throw new BadRequestException('Order is not pending approval');
    }

    // Determine original request type using quantity difference as primary heuristic
    const originalRequest: 'REJECT' | 'EDIT' =
      order.jumlahPesananAwal != null &&
      order.jumlahPesananAwal !== order.jumlahPesanan
        ? 'EDIT'
        : 'REJECT';

    // Capture pre-update status for audit trail
    const oldStatus = order.statusPesanan as StatusType;

    // Build update payload according to decision
    const decision = approveRejectDto.decision as ApprovalType;
    const data: any = {
      approvalStatus: decision as any,
      requiresApproval: false,
      approvedById: adminId,
      catatanAdmin: approveRejectDto.catatanAdmin ?? null,
    };

    if (decision === 'APPROVED') {
      if (originalRequest === 'REJECT') {
        // Approved rejection: move to DITOLAK
        data.statusPesanan = 'DITOLAK' as any;
      } else {
        // Approved edit: no status change (remain MENUNGGU_PERSETUJUAN)
        // Intentionally do not set data.statusPesanan here
      }
    } else if (decision === 'REJECTED') {
      // Rejected request returns to MENUNGGU for normal workflow
      if (originalRequest === 'EDIT' && order.jumlahPesananAwal != null) {
        data.jumlahPesanan = order.jumlahPesananAwal;
      }
      data.statusPesanan = 'MENUNGGU' as any;
    }

    const updated = await this.prisma.pesanan.update({
      where: { id },
      data,
      include: { pemesan: true, departemen: true, shift: true },
    });

    // Log status change transitions after DB update
    if (decision === 'APPROVED' && originalRequest === 'REJECT') {
      await this.auditTrail.logOrderStatusChanged(
        adminId,
        updated.kodePesanan,
        oldStatus as string,
        'DITOLAK',
      );
    } else if (decision === 'REJECTED') {
      await this.auditTrail.logOrderStatusChanged(
        adminId,
        updated.kodePesanan,
        oldStatus as string,
        'MENUNGGU',
      );
    }
    // Note: Approved EDIT has no status change logging

    await this.auditTrail.logApprovalDecision(
      adminId,
      updated.kodePesanan,
      decision as string,
      originalRequest === 'REJECT' ? 'REJECTION_REQUEST' : 'EDIT_REQUEST',
      approveRejectDto.catatanAdmin,
    );

    // Resolve requestedBy from audit trail logs if available
    const latestRequestLog = await this.prisma.auditTrail.findFirst({
      where: {
        aksi:
          originalRequest === 'REJECT'
            ? 'ORDER_REJECTION_REQUESTED'
            : 'ORDER_EDIT_REQUESTED',
        detail: { contains: updated.kodePesanan },
      },
      orderBy: { timestamp: 'desc' },
    });
    const requestedBy = latestRequestLog?.userId ?? 0;

    this.eventEmitter.emit(
      'order.approval.decided',
      new OrderApprovalDecidedEvent(
        updated.id,
        updated.kodePesanan,
        decision,
        admin.id,
        admin.nomorIndukKaryawan,
        approveRejectDto.catatanAdmin ?? null,
        originalRequest,
        updated.departmentPemesanId,
        requestedBy,
        new Date(),
      ),
    );

    return updated;
  }

  /**
   * getPendingApprovals
   * - List orders requiring approval with PENDING status
   * - Include related data
   * - Order by waktuDibuat descending
   */
  async getPendingApprovals() {
    return this.prisma.pesanan.findMany({
      where: {
        requiresApproval: true,
        approvalStatus: 'PENDING' as any,
      },
      include: { pemesan: true, departemen: true, shift: true },
      orderBy: { waktuDibuat: 'desc' },
    });
  }

  // Helpers

  private normalizeDateOnly(date: Date): Date {
    // Normalize to local midnight to avoid time component interfering with @db.Date
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private isTransitionAllowed(
    role: RoleAccessType,
    from: StatusType,
    to: StatusType,
  ): boolean {
    if (role === 'administrator') {
      return true;
    }
    if (role === 'employee') {
      // Employee is not allowed to change order status
      return false;
    }
    if (role === 'dapur') {
      return (
        (from === 'MENUNGGU' && to === 'IN_PROGRESS') ||
        (from === 'IN_PROGRESS' && to === 'READY')
      );
    }
    if (role === 'delivery') {
      return (
        (from === 'READY' && to === 'ON_DELIVERY') ||
        (from === 'ON_DELIVERY' && to === 'COMPLETE')
      );
    }
    return false;
  }

  private getTimestampFieldForStatus(status: StatusType): string | undefined {
    switch (status) {
      case 'IN_PROGRESS':
        return 'waktuDiproses';
      case 'READY':
        return 'waktuSiap';
      case 'ON_DELIVERY':
        return 'waktuDiantar';
      case 'COMPLETE':
        return 'waktuSelesai';
      default:
        return undefined;
    }
  }
}
