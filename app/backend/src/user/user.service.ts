import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  /**
   * 创建用户
   */
  async create(username: string, hashedPassword: string): Promise<UserDocument> {
    return this.userModel.create({ username, password: hashedPassword });
  }

  /**
   * 根据 ID 查找用户
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
