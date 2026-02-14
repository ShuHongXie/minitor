import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MonitorLogDocument = MonitorLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class MonitorLog {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop({ required: true })
  type: string;

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
