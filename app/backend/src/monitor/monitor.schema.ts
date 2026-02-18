import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MonitorLogDocument = MonitorLog & Document;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
    // 强制使用 UTC+8 时间存储，修正 "少8小时" 的问题
    // 注意：这会使数据库中存储的时间实际上偏离 UTC 标准
    currentTime: () => new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
})
export class MonitorLog {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop({ required: true })
  type: number;

  @Prop({ type: Number, required: false })
  subType?: number;

  @Prop()
  release: string;

  @Prop()
  version: string;

  @Prop()
  environment: string;

  @Prop()
  userId: string;

  @Prop({ required: true, index: true })
  timestamp: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  browserInfo: any;
}

export const MonitorLogSchema = SchemaFactory.createForClass(MonitorLog);
