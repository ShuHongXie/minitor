import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonitorLog, MonitorLogDocument } from './monitor.schema';

interface MonitorItem {
  appId: string;
  type: string;
  subType?: string;
  release?: string;
  environment?: string;
  userId?: string;
  timestamp?: number;
  reportTime?: number;
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
    if (logs.length > 0) {
      await this.monitorLogModel.insertMany(logs);
    }
  }

  private transformToLog(item: MonitorItem): Partial<MonitorLog> {
    const {
      appId,
      type,
      subType,
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
    let inferredSubType = subType;
    if (!subType && type === 'USER_BEHAVIOR') {
      if (rest.pageUrl && typeof rest.enterTime === 'number') inferredSubType = 'pv';
      else if (rest.elementHtml) inferredSubType = 'click';
      else if (rest.fromUrl && rest.toUrl) inferredSubType = 'page_transition';
    }

    return {
      appId,
      type,
      subType: inferredSubType,
      release,
      environment,
      userId,
      timestamp: timestamp || reportTime || Date.now(),
      browserInfo: {
        userAgent,
        screenResolution,
        language,
      },
      data: rest,
    };
  }
}
