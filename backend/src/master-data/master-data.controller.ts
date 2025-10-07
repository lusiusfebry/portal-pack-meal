import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { MasterDataService } from './master-data.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateJabatanDto,
  UpdateJabatanDto,
  CreateShiftDto,
  UpdateShiftDto,
  CreateLokasiDto,
  UpdateLokasiDto,
} from './dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

import { CreateShiftAliasPipe } from '../common/pipes/alias-transform.pipes';
@Controller('master-data')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // ========= READ (All roles) =========
  @Roles('administrator', 'employee', 'dapur', 'delivery')
  @Get('departments')
  async getDepartments() {
    return this.masterDataService.getDepartments();
  }

  @Roles('administrator', 'employee', 'dapur', 'delivery')
  @Get('jabatan')
  async getJabatan() {
    return this.masterDataService.getJabatan();
  }

  // Backward-compat route (alias)
  @Roles('administrator', 'employee', 'dapur', 'delivery')
  @Get('jabatans')
  async getJabatans() {
    return this.masterDataService.getJabatan();
  }

  @Roles('administrator', 'employee', 'dapur', 'delivery')
  @Get('shifts')
  async getShifts() {
    return this.masterDataService.getShifts();
  }

  @Roles('administrator', 'employee', 'dapur', 'delivery')
  @Get('lokasi')
  async getLokasi() {
    return this.masterDataService.getLokasi();
  }

  // ========= DEPARTMENTS (Admin only) =========
  @Post('departments')
  @Roles('administrator')
  @HttpCode(HttpStatus.CREATED)
  async createDepartment(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.createDepartment(admin.karyawanId, dto);
  }

  @Patch('departments/:id')
  @Roles('administrator')
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.updateDepartment(admin.karyawanId, id, dto);
  }

  @Delete('departments/:id')
  @Roles('administrator')
  @HttpCode(HttpStatus.OK)
  async deleteDepartment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.deleteDepartment(admin.karyawanId, id);
  }

  // ========= JABATAN (Admin only) =========
  @Post('jabatan')
  @Roles('administrator')
  @HttpCode(HttpStatus.CREATED)
  async createJabatan(
    @Body() dto: CreateJabatanDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.createJabatan(admin.karyawanId, dto);
  }

  @Patch('jabatan/:id')
  @Roles('administrator')
  async updateJabatan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJabatanDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.updateJabatan(admin.karyawanId, id, dto);
  }

  @Delete('jabatan/:id')
  @Roles('administrator')
  @HttpCode(HttpStatus.OK)
  async deleteJabatan(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.deleteJabatan(admin.karyawanId, id);
  }

  // ========= SHIFTS (Admin only) =========
  @Post('shifts')
  @Roles('administrator')
  @HttpCode(HttpStatus.CREATED)
  async createShift(
    @Body(CreateShiftAliasPipe) dto: CreateShiftDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.createShift(admin.karyawanId, dto);
  }

  @Patch('shifts/:id')
  @Roles('administrator')
  async updateShift(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.updateShift(admin.karyawanId, id, dto);
  }

  @Delete('shifts/:id')
  @Roles('administrator')
  @HttpCode(HttpStatus.OK)
  async deleteShift(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.deleteShift(admin.karyawanId, id);
  }

  // ========= LOKASI (Admin only) =========
  @Post('lokasi')
  @Roles('administrator')
  @HttpCode(HttpStatus.CREATED)
  async createLokasi(
    @Body() dto: CreateLokasiDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.createLokasi(admin.karyawanId, dto);
  }

  @Patch('lokasi/:id')
  @Roles('administrator')
  async updateLokasi(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLokasiDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.updateLokasi(admin.karyawanId, id, dto);
  }

  @Delete('lokasi/:id')
  @Roles('administrator')
  @HttpCode(HttpStatus.OK)
  async deleteLokasi(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.masterDataService.deleteLokasi(admin.karyawanId, id);
  }
}