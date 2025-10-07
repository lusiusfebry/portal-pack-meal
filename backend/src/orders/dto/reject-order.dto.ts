import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RejectOrderDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  catatanDapur!: string;
}
