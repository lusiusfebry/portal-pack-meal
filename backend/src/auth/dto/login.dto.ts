import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nik!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
