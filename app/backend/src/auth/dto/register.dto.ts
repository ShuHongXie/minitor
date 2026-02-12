import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: '用户名长度不能小于3' })
  @MaxLength(20, { message: '用户名长度不能大于20' })
  username!: string;

  @IsString()
  @MinLength(6, { message: '密码长度不能小于6' })
  @MaxLength(50, { message: '密码长度不能大于50' })
  password!: string;
}
