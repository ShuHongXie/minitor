import { Module } from '@nestjs/common';
import { WecomService } from './wecom.service';

@Module({
  providers: [WecomService],
  exports: [WecomService],
})
export class WecomModule {}
