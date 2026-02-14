import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SourcemapService } from './sourcemap.service';
import { SourcemapController } from './sourcemap.controller';
import { Sourcemap, SourcemapSchema } from './sourcemap.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sourcemap.name, schema: SourcemapSchema }])],
  controllers: [SourcemapController],
  providers: [SourcemapService],
})
export class SourcemapModule {}
