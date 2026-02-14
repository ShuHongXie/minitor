import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { MonitorLog, MonitorLogSchema } from './monitor.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MonitorLog.name, schema: MonitorLogSchema }])],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
