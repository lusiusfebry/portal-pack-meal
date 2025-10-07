import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  namaDivisi!: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}