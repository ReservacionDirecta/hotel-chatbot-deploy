import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(['admin', 'user'])
  role: string;
}