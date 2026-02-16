import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sourcemap, SourcemapDocument } from './sourcemap.schema';

@Injectable()
export class SourcemapService {
  constructor(@InjectModel(Sourcemap.name) private sourcemapModel: Model<SourcemapDocument>) {}

  async create(data: {
    appId: string;
    version: string;
    createTime: number;
    fileName: string;
    filePath: string;
    originalFileName?: string;
  }): Promise<Sourcemap> {
    const record = new this.sourcemapModel(data);
    return record.save();
  }

  async findLatestVersion(appId: string): Promise<string | null> {
    const record = await this.sourcemapModel.findOne({ appId }).sort({ createTime: -1 }).exec();
    return record ? record.version : null;
  }
}
