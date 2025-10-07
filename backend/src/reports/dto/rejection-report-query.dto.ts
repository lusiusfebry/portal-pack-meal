import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { ApprovalStatus } from '@prisma/client';
import { ApprovalStatusEnum } from '../../orders/dto/approve-reject-order.dto';

export class RejectionReportQueryDto {
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

  @IsEnum(ApprovalStatusEnum)
  @IsOptional()
  approvalStatus?: ApprovalStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit: number = 50;
}
