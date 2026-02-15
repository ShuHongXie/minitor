import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { MonitorService } from './monitor.service';
import ErrorStackParser from 'error-stack-parser';
import sourceMap from 'source-map';
import { ApiErrorCode } from '../enums/responseCode.enum';
import fs from 'fs';
import path from 'path';

interface MonitorData {
  appId: string;
  projectName?: string;
  [key: string]: any;
}

/**
 * 从错误堆栈中提取第一个错误文件名
 * 解析堆栈信息,提取第一个有效的文件路径(包含行号和列号)
 *
 * @param {string | null | undefined} stack - 错误堆栈字符串
 * @returns {string | null} 提取出的文件名(如 'index-Cic8HWFC.js:161836:34'),如果无法提取则返回 null
 *
 * @example
 * const stack = `TypeError: Failed to fetch
 *   at window.fetch (http://172.18.108.26:8080/assets/index-Cic8HWFC.js:161836:34)
 *   at btnFetchClick (http://172.18.108.26:8080/assets/index-Cic8HWFC.js:77701:11)`
 * extractFirstErrorFile(stack) // 返回 'index-Cic8HWFC.js:161836:34'
 */
export const extractFirstErrorFile = (stack: string | null | undefined): string | null => {
  console.log('stack', stack);

  if (!stack || typeof stack !== 'string') {
    return null;
  }
  // 正则匹配: http(s)://域名/路径/文件名:行号:列号
  // 示例: http://172.18.108.26:8080/assets/index-Cic8HWFC.js:161836:34
  const regex = /https?:\/\/[^/]+\/(?:.*\/)?(\S+\.js):(\d+):(\d+)/;
  const match = stack.match(regex);

  if (match) {
    // match[1] 是文件名, match[2] 是行号, match[3] 是列号
    return `${match[1]}`;
  }

  return null;
};

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { flag: 'r' }, (err, data) => {
        if (err) reject(err);
        else resolve(data.toString());
      });
    });
  }

  @Post('report')
  @HttpCode(HttpStatus.NO_CONTENT)
  async report(@Body() rawData: any) {
    // console.log('==================上报数据:rawData', rawData);
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

  @Post('list')
  async list(@Body() body: { errorType?: number; pageSize?: number; currentPage?: number }) {
    const { errorType, pageSize = 10, currentPage = 1 } = body;
    return this.monitorService.findAll({
      errorType,
      pageSize: Number(pageSize),
      currentPage: Number(currentPage),
    });
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return this.monitorService.findById(id);
  }

  @Post('/analyze')
  async analyze(@Body() error: Error) {
    if (!error) {
      return {
        msg: '错误栈信息不能为空',
        code: ApiErrorCode.COMMON_CODE,
        data: null,
      };
    }
    const fileName = extractFirstErrorFile(error.stack);
    if (!fileName) {
      return {
        msg: '无法提取错误文件名',
        code: ApiErrorCode.COMMON_CODE,
        data: null,
      };
    }
    console.log('文件路径：', path.resolve(process.cwd(), 'uploads/sourcemaps', fileName));
    const mapFileName = fileName.endsWith('.map') ? fileName : `${fileName}.map`;
    const mapFilePath = path.join(process.cwd(), 'uploads', 'sourcemaps', mapFileName);

    console.log('正在读取 Source Map 文件:', mapFilePath);

    if (!fs.existsSync(mapFilePath)) {
      return {
        msg: `Source Map 文件不存在: ${mapFileName}`,
        code: ApiErrorCode.COMMON_CODE,
        data: null,
      };
    }
    // 读取Source Map文件， 直接读取dist目录下对应的map文件，真实情况是需要上传至服务器的
    const sourceMapFileContent: string = await this.readFile(mapFilePath);
    // 解析错误栈信息
    const tracey = ErrorStackParser.parse(error);
    const sourceMapContent = JSON.parse(sourceMapFileContent);
    // 根据source map文件创建SourceMapConsumer实例
    const consumer = await new sourceMap.SourceMapConsumer(sourceMapContent);

    // 获取第一条错误栈信息
    const errorInfo = tracey[0];

    // 根据打包后代码的错误位置解析出源码对应的错误信息位置
    const originalPosition = consumer.originalPositionFor({
      line: errorInfo.lineNumber || 0,
      column: errorInfo.columnNumber || 0,
    });

    // 获取源码内容
    const sourceContent = originalPosition.source
      ? consumer.sourceContentFor(originalPosition.source)
      : '';

    return {
      msg: '解析成功',
      code: ApiErrorCode.SUCCESS,
      data: {
        sourceContent,
        ...originalPosition,
      },
    };
  }
}
