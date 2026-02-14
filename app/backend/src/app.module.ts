import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { MonitorModule } from './monitor/monitor.module';
import { SourcemapModule } from './sourcemap/sourcemap.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/minitrack'),
    AuthModule,
    ProjectsModule,
    MonitorModule,
    SourcemapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
