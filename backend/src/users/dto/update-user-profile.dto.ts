import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, ValidateIf } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  namaLengkap!: string;

  // Optional: allow clearing with null, or setting with a valid integer
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  departmentId?: number | null;

  // Optional: allow clearing with null, or setting with a valid integer
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  jabatanId?: number | null;
}