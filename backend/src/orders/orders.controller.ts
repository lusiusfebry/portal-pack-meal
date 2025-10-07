import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

import type { JwtPayload } from '../common/interfaces';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  RejectOrderDto,
  EditOrderDto,
  ApproveRejectOrderDto,
  QueryOrdersDto,
} from './dto';

/**
 * Safe fallback type alias matching Prisma RoleAccess enum values.
 * When Prisma Client exports RoleAccess, the union will still be compatible.
 */
type RoleAccessType = 'administrator' | 'employee' | 'dapur' | 'delivery';

/**
 * OrdersController
 *
 * Route prefix: /api/orders (global prefix 'api' configured in bootstrap)
 * Guarding: RolesGuard at class-level, JwtAuthGuard applied globally in bootstrap
 *
 * Endpoint Organization:
 * - Standard flow: create, list, details, status update
 * - Exception flow: request-rejection, request-edit
 * - Admin tools: pending-approvals, approve-reject
 */
@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /api/orders
   * Create new order (Employee only)
   */
  @Post()
  @Roles('employee')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.create(user.karyawanId, createOrderDto);
  }

  /**
   * GET /api/orders
   * List orders (role-based filtering)
   */
  @Get()
  @Roles('employee', 'dapur', 'delivery', 'administrator')
  async findAll(
    @Query() queryDto: QueryOrdersDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.findAll(
      user.karyawanId,
      user.role as RoleAccessType,
      queryDto,
    );
  }

  /**
   * GET /api/orders/pending-approvals
   * Get pending approval requests (Admin only)
   *
   * Note: Must be defined BEFORE @Get(':id') to avoid route conflict
   */
  @Get('pending-approvals')
  @Roles('administrator')
  async getPendingApprovals(): Promise<any[]> {
    return this.ordersService.getPendingApprovals();
  }

  /**
   * GET /api/orders/:id
   * Get order details
   */
  @Get(':id')
  @Roles('employee', 'dapur', 'delivery', 'administrator')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.findOne(
      id,
      user.karyawanId,
      user.role as RoleAccessType,
    );
  }

  /**
   * PATCH /api/orders/:id/status
   * Update order status (Dapur, Delivery, Admin)
   */
  @Patch(':id/status')
  @Roles('dapur', 'delivery', 'administrator')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.updateStatus(
      id,
      user.karyawanId,
      user.role as RoleAccessType,
      updateStatusDto,
    );
  }

  /**
   * POST /api/orders/:id/request-rejection
   * Request order rejection (Dapur only)
   */
  @Post(':id/request-rejection')
  @Roles('dapur')
  @HttpCode(HttpStatus.OK)
  async requestRejection(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDto: RejectOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.requestRejection(id, user.karyawanId, rejectDto);
  }

  /**
   * POST /api/orders/:id/request-edit
   * Request order quantity edit (Dapur only)
   */
  @Post(':id/request-edit')
  @Roles('dapur')
  @HttpCode(HttpStatus.OK)
  async requestEdit(
    @Param('id', ParseIntPipe) id: number,
    @Body() editDto: EditOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.requestEdit(id, user.karyawanId, editDto);
  }

  /**
   * POST /api/orders/:id/approve-reject
   * Approve or reject approval request (Admin only)
   */
  @Post(':id/approve-reject')
  @Roles('administrator')
  @HttpCode(HttpStatus.OK)
  async approveRejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() approveRejectDto: ApproveRejectOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.ordersService.approveRejectRequest(
      id,
      user.karyawanId,
      approveRejectDto,
    );
  }
}
