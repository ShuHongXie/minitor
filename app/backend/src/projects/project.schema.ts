import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  appId: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  description: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
