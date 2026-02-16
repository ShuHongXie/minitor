import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as crypto from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const existingProject = await this.projectModel.findOne({ name: createProjectDto.name }).exec();
    if (existingProject) {
      throw new Error('Project name already exists');
    }

    const appId = crypto.randomUUID();
    const createdProject = new this.projectModel({
      ...createProjectDto,
      appId,
    });
    return createdProject.save();
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    name?: string,
  ): Promise<{ data: Project[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const filter: any = {};
    if (name) {
      (filter as { name?: any }).name = { $regex: name, $options: 'i' };
    }
    const [data, total] = await Promise.all([
      this.projectModel.find(filter).skip(skip).limit(pageSize).exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).exec();
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project | null> {
    return this.projectModel.findByIdAndUpdate(id, updateProjectDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Project | null> {
    return this.projectModel.findByIdAndDelete(id).exec();
  }
}
