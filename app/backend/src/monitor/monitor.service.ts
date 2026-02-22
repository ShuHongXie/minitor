import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonitorLog, MonitorLogDocument } from './monitor.schema';
import { ReportType } from './types';
import { WecomService } from '../wecom/wecom.service';

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
  constructor(
    @InjectModel(MonitorLog.name) private monitorLogModel: Model<MonitorLogDocument>,
    private readonly wecomService: WecomService,
  ) {}

  async processAndSave(items: any[]): Promise<void> {
    const logs = items.map((item: MonitorItem) => this.transformToLog(item));
    // console.log('==================转换后的日志:logs', logs);

    if (logs.length > 0) {
      await this.monitorLogModel.insertMany(logs);

      // Send error notifications to WeCom
      for (const log of logs) {
        if (
          log.type &&
          [
            ReportType.ERROR,
            ReportType.RESOURCE_ERROR,
            ReportType.NETWORK_ERROR,
            ReportType.JAVASCRIPT_ERROR,
            ReportType.WHITE_SCREEN_ERROR,
          ].includes(log.type)
        ) {
          await this.sendErrorNotification(log);
        }
      }
    }
  }

  private async sendErrorNotification(log: Partial<MonitorLog>) {
    const typeName = log.type ? ReportType[log.type] : 'UNKNOWN_ERROR';
    const time = new Date(log.timestamp || Date.now()).toLocaleString();
    const pageUrl = log.data?.pageUrl || 'N/A';

    const content = `
<font color="warning">Monitor Error Alert</font>
>App: <font color="comment">${log.appId}</font>
>Type: <font color="comment">${typeName}</font>
>User: <font color="comment">${log.userId || 'Anonymous'}</font>
>Page: <font color="comment">${pageUrl}</font>
>Time: <font color="comment">${time}</font>

**Error Details:**
\`\`\`json
${JSON.stringify(log.data, null, 2)}
\`\`\`
    `;
    await this.wecomService.sendMarkdown(content);
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

  async getWebVitalsStats(appId: string, startTime?: number, endTime?: number): Promise<any[]> {
    const match: any = {
      appId,
      type: ReportType.WEB_VITALS,
    };

    if (startTime || endTime) {
      match.timestamp = {};
      if (startTime) match.timestamp.$gte = startTime;
      if (endTime) match.timestamp.$lte = endTime;
    }

    return this.monitorLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$data.name',
          avgValue: { $avg: '$data.value' },
          count: { $sum: 1 },
          max: { $max: '$data.value' },
          min: { $min: '$data.value' },
        },
      },
      {
        $project: {
          name: '$_id',
          avgValue: 1,
          count: 1,
          max: 1,
          min: 1,
          _id: 0,
        },
      },
    ]);
  }

  async getWebVitalsPageStats(
    appId: string,
    metricName: string,
    startTime?: number,
    endTime?: number,
  ): Promise<any[]> {
    const match: any = {
      appId,
      type: ReportType.WEB_VITALS,
      'data.name': metricName,
    };

    if (startTime || endTime) {
      match.timestamp = {};
      if (startTime) match.timestamp.$gte = startTime;
      if (endTime) match.timestamp.$lte = endTime;
    }

    return this.monitorLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$data.pagePath',
          avgValue: { $avg: '$data.value' },
          count: { $sum: 1 },
          max: { $max: '$data.value' },
          min: { $min: '$data.value' },
        },
      },
      {
        $project: {
          pagePath: '$_id',
          avgValue: 1,
          count: 1,
          max: 1,
          min: 1,
          _id: 0,
        },
      },
      { $sort: { avgValue: -1 } },
    ]);
  }

  async getPVStats(appId: string, startTime?: number, endTime?: number): Promise<any[]> {
    const match: any = {
      appId,
      type: ReportType.PV,
    };

    if (startTime || endTime) {
      match.timestamp = {};
      if (startTime) match.timestamp.$gte = startTime;
      if (endTime) match.timestamp.$lte = endTime;
    }

    return this.monitorLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$data.pagePath',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          pagePath: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getClickStats(appId: string, startTime?: number, endTime?: number): Promise<any[]> {
    const match: any = {
      appId,
      type: ReportType.CLICK,
    };

    if (startTime || endTime) {
      match.timestamp = {};
      if (startTime) match.timestamp.$gte = startTime;
      if (endTime) match.timestamp.$lte = endTime;
    }

    return this.monitorLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            pagePath: '$data.pagePath',
            elementHtml: '$data.elementHtml',
            xpath: '$data.xpath',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          pagePath: '$_id.pagePath',
          elementHtml: '$_id.elementHtml',
          xpath: '$_id.xpath',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getPageTransitionStats(
    appId: string,
    startTime?: number,
    endTime?: number,
  ): Promise<any[]> {
    const match: any = {
      appId,
      type: ReportType.PAGE_TRANSITION,
    };

    if (startTime || endTime) {
      match.timestamp = {};
      if (startTime) match.timestamp.$gte = startTime;
      if (endTime) match.timestamp.$lte = endTime;
    }

    return this.monitorLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            from: '$data.fromPath',
            to: '$data.toPath',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          from: '$_id.from',
          to: '$_id.to',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getWhiteScreenStats(appId: string, startTime?: number, endTime?: number): Promise<any[]> {
    const match: any = {
      appId,
      type: ReportType.WHITE_SCREEN_ERROR,
    };

    if (startTime || endTime) {
      match.timestamp = {};
      if (startTime) match.timestamp.$gte = startTime;
      if (endTime) match.timestamp.$lte = endTime;
    }

    return this.monitorLogModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$data.pageUrl',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          pageUrl: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
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
