import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫
 * 使用 @UseGuards(JwtAuthGuard) 装饰器保护需要鉴权的路由
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
