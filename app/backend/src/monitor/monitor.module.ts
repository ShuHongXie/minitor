import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { MonitorLog, MonitorLogSchema } from './monitor.schema';
import { WecomModule } from '../wecom/wecom.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MonitorLog.name, schema: MonitorLogSchema }]),
    WecomModule,
  ],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
