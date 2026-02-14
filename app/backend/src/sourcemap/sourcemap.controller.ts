import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SourcemapService } from './sourcemap.service';
import { extname, join } from 'path';
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
    @Headers('x-app-id') appId: string,
    @Headers('x-release-version') release: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!appId || !release)
      throw new BadRequestException('x-app-id and x-release-version headers are required');

    // 手动处理文件保存逻辑
    const uploadDir = join(process.cwd(), 'uploads', 'sourcemaps');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
    const filePath = join(uploadDir, fileName);

    // 将内存中的 buffer 写入文件
    fs.writeFileSync(filePath, file.buffer);

    return this.sourcemapService.saveSourcemapRecord({
      appId,
      release,
      fileName: fileName,
      filePath: filePath,
      originalFileName: file.originalname,
    });
  }
}
