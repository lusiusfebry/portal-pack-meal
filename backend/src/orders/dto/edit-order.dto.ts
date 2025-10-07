import { IsInt, IsString, IsNotEmpty, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class EditOrderDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  jumlahPesananBaru!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  catatanDapur!: string;
}
