import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SourcemapDocument = Sourcemap & Document;

@Schema({ timestamps: true })
export class Sourcemap {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop({ required: true, index: true })
  release: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop()
  originalFileName: string;
}

export const SourcemapSchema = SchemaFactory.createForClass(Sourcemap);
