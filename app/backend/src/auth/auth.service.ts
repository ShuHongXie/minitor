import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(dto: RegisterDto) {
    // 检查用户是否已存在
    const existing = await this.userService.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    // 密码哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 创建用户
    const user = await this.userService.create(dto.username, hashedPassword);

    return {
      message: '注册成功',
      userId: user._id,
      username: user.username,
    };
  }

  /**
   * 用户登录
   */
  async login(dto: LoginDto) {
    // 查找用户
    const user = await this.userService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 校验密码
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT token
    const payload = { sub: user._id.toString(), username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: '登录成功',
      accessToken,
    };
  }

  /**
   * 根据 JWT payload 中的 userId 获取用户信息
   */
  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user._id,
      username: user.username,
    };
  }
}
