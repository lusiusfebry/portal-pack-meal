import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum ConsumptionGroupBy {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class ConsumptionReportQueryDto {
  @IsDateString()
  @IsOptional()
  tanggalMulai?: string;

  @IsDateString()
  @IsOptional()
  tanggalAkhir?: string;

  @IsEnum(ConsumptionGroupBy)
  @IsOptional()
  groupBy: ConsumptionGroupBy = ConsumptionGroupBy.DAILY;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  shiftId?: number;
}
