import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonitorLog, MonitorLogDocument } from './monitor.schema';
import { ReportType } from './types';

interface MonitorItem {
  appId: string;
  type: ReportType;
  subType?: number;
  errorType?: number;
  release?: string;
  environment?: string;
  userId?: string;
  timestamp?: number | string;
  reportTime?: number | string;
  pageUrl?: string;
  enterTime?: number;
  elementHtml?: string;
  fromUrl?: string;
  toUrl?: string;
  userAgent?: string;
  screenResolution?: string;
  language?: string;
  [key: string]: any;
}

@Injectable()
export class MonitorService {
  constructor(@InjectModel(MonitorLog.name) private monitorLogModel: Model<MonitorLogDocument>) {}

  async processAndSave(items: any[]): Promise<void> {
    const logs = items.map((item: MonitorItem) => this.transformToLog(item));
    // console.log('==================转换后的日志:logs', logs);

    if (logs.length > 0) {
      await this.monitorLogModel.insertMany(logs);
    }
  }

  async findAll(params: {
    type?: number;
    subType?: number;
    appId?: string;
    pageSize: number;
    currentPage: number;
  }): Promise<{ list: MonitorLog[]; total: number }> {
    const { type, subType, appId, pageSize, currentPage } = params;
    const filter: { type?: ReportType; subType?: number; appId?: string } = {};
    if (type) {
      filter.type = type as ReportType;
    }
    if (subType) {
      filter.subType = subType;
    }
    if (appId) {
      filter.appId = appId;
    }

    const total = await this.monitorLogModel.countDocuments(filter).exec();
    const list = await this.monitorLogModel
      .find(filter)
      .sort({ timestamp: -1, _id: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return { list, total };
  }

  async findById(id: string): Promise<MonitorLog | null> {
    return this.monitorLogModel.findById(id).exec();
  }

  private transformToLog(item: MonitorItem): Partial<MonitorLog> {
    const {
      appId,
      type,
      subType,
      errorType,
      release,
      environment,
      userId,
      timestamp,
      reportTime,
      // Browser info fields
      userAgent,
      screenResolution,
      language,
      ...rest
    } = item;

    // Infer subType if not present
    let inferredSubType: number | undefined;
    if (typeof errorType === 'number') {
      inferredSubType = errorType;
    } else if (typeof subType === 'number') {
      inferredSubType = subType;
    }

    if (inferredSubType === undefined) {
      if (type === ReportType.JAVASCRIPT_ERROR) {
        inferredSubType = 1; // ErrorType.JAVASCRIPT_ERROR
      }
    }

    const normalizedTimestamp = this.normalizeTimestamp(timestamp ?? reportTime);

    return {
      appId,
      type,
      subType: inferredSubType,
      release,
      version: item.version,
      environment,
      userId,
      timestamp: normalizedTimestamp,
      browserInfo: {
        userAgent,
        screenResolution,
        language,
      },
      data: rest,
    };
  }

  private normalizeTimestamp(value?: number | string): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return Date.now();
  }
}
