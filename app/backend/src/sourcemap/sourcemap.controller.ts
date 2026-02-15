import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Headers,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SourcemapService } from './sourcemap.service';
import { join } from 'path';
import * as fs from 'fs';

// 定义一个本地的文件类型接口，避免依赖 Express.Multer.File
interface UploadedMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('sourcemap')
export class SourcemapController {
  constructor(private readonly sourcemapService: SourcemapService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 使用内存存储，不配置 diskStorage
  async uploadFile(
    @UploadedFile() file: UploadedMulterFile,
    @Body() body: { version: string; createTime: string },
    @Headers('x-app-id') appId: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!appId) throw new BadRequestException('x-app-id headers are required');

    // 手动处理文件保存逻辑
    const uploadDir = join(process.cwd(), 'uploads', 'sourcemaps');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = file.originalname;
    const filePath = join(uploadDir, fileName);

    // 将内存中的 buffer 写入文件
    fs.writeFileSync(filePath, file.buffer);

    return this.sourcemapService.create({
      appId,
      version: body.version,
      createTime: body.createTime ? parseInt(body.createTime, 10) : Date.now(),
      fileName: fileName,
      filePath: filePath,
    });
  }
}
