import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import * as crypto from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const appId = crypto.randomUUID();
    const createdProject = new this.projectModel({
      ...createProjectDto,
      appId,
    });
    return createdProject.save();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }
}
