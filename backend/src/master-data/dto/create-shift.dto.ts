import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  namaShift!: string;

  // Format jam HH:mm atau HH:mm:ss
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, {
    message: 'jamMulai harus berupa waktu dengan format HH:mm atau HH:mm:ss',
  })
  jamMulai!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, {
    message: 'jamSelesai harus berupa waktu dengan format HH:mm atau HH:mm:ss',
  })
  jamSelesai!: string;

  @IsOptional()
  @IsString()
  keterangan?: string;
}