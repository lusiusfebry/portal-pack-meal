import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

export class UpdateLokasiDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaLokasi?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}