import { IsEnum, IsNotEmpty } from 'class-validator';

// Fallback enum konsisten dengan schema.prisma untuk validasi
export const RoleAccessEnum = {
  administrator: 'administrator',
  employee: 'employee',
  dapur: 'dapur',
  delivery: 'delivery',
} as const;

export type RoleAccessType =
  (typeof RoleAccessEnum)[keyof typeof RoleAccessEnum];

export class UpdateUserRoleDto {
  @IsEnum(RoleAccessEnum)
  @IsNotEmpty()
  roleAccess!: RoleAccessType;
}
