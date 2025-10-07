import {
  IsInt,
  IsNotEmpty,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  shiftId!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  jumlahPesanan!: number;

  @IsDateString()
  @IsOptional()
  tanggalPesanan?: string;
}
