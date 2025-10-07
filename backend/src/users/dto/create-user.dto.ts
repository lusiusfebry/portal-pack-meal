import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';

// Fallback enum yang konsisten dengan schema.prisma bila '@prisma/client' belum mengekspor RoleAccess
export const RoleAccessEnum = {
  administrator: 'administrator',
  employee: 'employee',
  dapur: 'dapur',
  delivery: 'delivery',
} as const;

export type RoleAccessType =
  (typeof RoleAccessEnum)[keyof typeof RoleAccessEnum];

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  nik!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  namaLengkap!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(RoleAccessEnum)
  @IsNotEmpty()
  roleAccess!: RoleAccessType;

  @IsInt()
  @IsOptional()
  departmentId?: number;

  @IsInt()
  @IsOptional()
  jabatanId?: number;

  @IsString()
  @IsOptional()
  keterangan?: string;
}
