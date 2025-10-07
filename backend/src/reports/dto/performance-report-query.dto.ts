import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PerformanceReportQueryDto {
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

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  shiftId?: number;
}
