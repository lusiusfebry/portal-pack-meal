import { IsDateString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import type { StatusPesanan } from '@prisma/client';
import { StatusPesananEnum } from '../../orders/dto/update-order-status.dto';

export class DepartmentReportQueryDto {
  @IsDateString()
  @IsOptional()
  tanggalMulai?: string;

  @IsDateString()
  @IsOptional()
  tanggalAkhir?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  departmentId?: number;

  @IsEnum(StatusPesananEnum)
  @IsOptional()
  status?: StatusPesanan;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  shiftId?: number;
}
