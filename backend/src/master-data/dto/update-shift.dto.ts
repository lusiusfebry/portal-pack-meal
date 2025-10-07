import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  namaShift?: string;

  // Format jam HH:mm atau HH:mm:ss
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, {
    message: 'jamMulai harus berupa waktu dengan format HH:mm atau HH:mm:ss',
  })
  jamMulai?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, {
    message: 'jamSelesai harus berupa waktu dengan format HH:mm atau HH:mm:ss',
  })
  jamSelesai?: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}