import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SourcemapDocument = Sourcemap & Document;

@Schema({ timestamps: true })
export class Sourcemap {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop()
  version: string;

  @Prop()
  createTime: number;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;
}

export const SourcemapSchema = SchemaFactory.createForClass(Sourcemap);
