import { SetMetadata } from '@nestjs/common';

// NOTE:
// Prisma Client enum export can vary by version/generation state.
// To keep compilation stable even if '@prisma/client' doesn't yet expose RoleAccess,
// we define a safe type alias that matches the enum values in schema.prisma.
// When Prisma Client is generated and exports RoleAccess, you can switch the alias to:
//   import type { RoleAccess } from '@prisma/client';
//   type RoleAccessType = RoleAccess;
type RoleAccessType = 'administrator' | 'employee' | 'dapur' | 'delivery';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleAccessType[]) =>
  SetMetadata(ROLES_KEY, roles);
