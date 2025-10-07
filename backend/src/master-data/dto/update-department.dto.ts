import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaDivisi?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}