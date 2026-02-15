import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { MonitorService } from './monitor.service';

interface MonitorData {
  appId: string;
  projectName?: string;
  [key: string]: any;
}

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Post('report')
  @HttpCode(HttpStatus.NO_CONTENT)
  async report(@Body() rawData: any) {
    console.log('==================上报数据:rawData', rawData);
    if (!rawData) {
      throw new BadRequestException('Data is required');
    }

    const items = (Array.isArray(rawData) ? rawData : [rawData]) as MonitorData[];

    // Filter valid items
    const validItems = items.filter((item): item is MonitorData => Boolean(item && item.appId));

    if (validItems.length > 0) {
      await this.monitorService.processAndSave(validItems);
    }
  }
}
