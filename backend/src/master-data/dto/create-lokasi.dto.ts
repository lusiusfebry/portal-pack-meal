import { IsNotEmpty, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

export class CreateLokasiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  namaLokasi!: string;

  @IsString()
  @IsNotEmpty()
  alamat!: string;

  @IsOptional()
  @IsString()
  keterangan?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}