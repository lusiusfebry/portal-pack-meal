import { IsOptional, IsString, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateJabatanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaJabatan?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @IsOptional()
  @IsString()
  keterangan?: string;
}