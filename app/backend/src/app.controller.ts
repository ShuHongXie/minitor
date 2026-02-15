import { Controller, Post, Body } from '@nestjs/common';
import * as ErrorStackParser from 'error-stack-parser';

@Controller()
export class AppController {
  @Post()
  getHello(@Body('stack') stack: string): any {
    try {
      return ErrorStackParser.parse({ stack } as Error);
    } catch (e) {
      return {
        error: 'Failed to parse stack trace',
        details: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
