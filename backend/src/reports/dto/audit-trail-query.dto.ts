import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AuditTrailQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  aksi?: string;

  @IsDateString()
  @IsOptional()
  tanggalMulai?: string;

  @IsDateString()
  @IsOptional()
  tanggalAkhir?: string;

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
