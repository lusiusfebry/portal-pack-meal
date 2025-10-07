import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateUserDto, UpdateUserStatusDto, UpdateUserRoleDto, UpdateUserProfileDto } from './dto';
import { CreateUserAliasPipe } from '../common/pipes/alias-transform.pipes';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /api/users
  @Post()
  @Roles('administrator')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(CreateUserAliasPipe) createUserDto: CreateUserDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<any> {
    return this.usersService.createUser(admin.karyawanId, createUserDto);
  }

  // GET /api/users
  @Get()
  @Roles('administrator')
  async findAll(): Promise<any[]> {
    return this.usersService.findAll();
  }

  // GET /api/users/:id
  @Get(':id')
  @Roles('administrator')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.usersService.findOne(id);
  }

  // PATCH /api/users/:id/status
  @Patch(':id/status')
  @Roles('administrator')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<any> {
    return this.usersService.updateStatus(
      admin.karyawanId,
      id,
      updateStatusDto,
    );
  }

  // PATCH /api/users/:id/role
  @Patch(':id/role')
  @Roles('administrator')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<any> {
    return this.usersService.updateRole(admin.karyawanId, id, updateRoleDto);
  }

  // POST /api/users/:id/reset-password
  @Post(':id/reset-password')
  @Roles('administrator')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
  ): Promise<{ message: string; tempPassword: string }> {
    return this.usersService.resetPassword(admin.karyawanId, id);
  }
// PATCH /api/users/:id/profile
@Patch(':id/profile')
@Roles('administrator')
async updateProfile(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateProfileDto: UpdateUserProfileDto,
  @CurrentUser() admin: JwtPayload,
): Promise<any> {
  return this.usersService.updateProfile(admin.karyawanId, id, updateProfileDto);
}
}
