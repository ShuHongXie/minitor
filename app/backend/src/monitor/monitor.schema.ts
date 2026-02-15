import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ReportType {
  /**
   * 错误上报
   */
  ERROR = 1,

  /**
   * Web Vitals 性能指标上报
   */
  WEB_VITALS = 2,

  /**
   * 自定义事件上报
   */
  CUSTOM_EVENT = 3,

  /**
   * 用户行为上报
   */
  USER_BEHAVIOR = 4,

  /**
   * 资源错误上报
   */
  RESOURCE_ERROR = 5,

  /**
   * 网络错误上报
   */
  NETWORK_ERROR = 6,

  /**
   * JS 错误上报
   */
  JAVASCRIPT_ERROR = 7,
}

export type MonitorLogDocument = MonitorLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class MonitorLog {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop({ required: true })
  type: number;

  @Prop()
  subType: string;

  @Prop()
  release: string;

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
