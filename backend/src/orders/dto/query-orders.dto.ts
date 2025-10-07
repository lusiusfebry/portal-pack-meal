import { IsEnum, IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  StatusPesananEnum,
  StatusPesananType,
} from './update-order-status.dto';

export class QueryOrdersDto {
  @IsEnum(StatusPesananEnum)
  @IsOptional()
  status?: StatusPesananType;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  departmentId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  shiftId?: number;

  @IsDateString()
  @IsOptional()
  tanggalMulai?: string;

  @IsDateString()
  @IsOptional()
  tanggalAkhir?: string;

  @IsOptional()
  @Type(() => Boolean)
  requiresApproval?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
