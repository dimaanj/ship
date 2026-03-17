import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';

import { PublicUser, User, UserDocument } from './users.schema.js';

interface PaginationOptions {
  page: number;
  perPage: number;
}

interface SortOptions {
  sort: Record<string, SortOrder>;
}

interface PaginatedResult<T> {
  results: T[];
  pagesCount: number;
  count: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findOne(filter: FilterQuery<User>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  async exists(filter: FilterQuery<User>): Promise<boolean> {
    const doc = await this.userModel.exists(filter).exec();
    return !!doc;
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async updateOne(filter: FilterQuery<User>, update: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(filter, { $set: update }, { new: true }).exec();
  }

  updateLastRequest(id: string): void {
    this.userModel.updateOne({ _id: id }, { $set: { lastRequest: new Date() } }).exec();
  }

  async softDelete(filter: FilterQuery<User>): Promise<void> {
    await this.userModel.updateOne(filter, { $set: { deletedOn: new Date() } }).exec();
  }

  async find(
    filter: FilterQuery<User>,
    pagination: PaginationOptions,
    options: SortOptions,
  ): Promise<PaginatedResult<UserDocument>> {
    const { page, perPage } = pagination;
    const skip = (page - 1) * perPage;

    const [results, count] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(options.sort)
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      results,
      pagesCount: Math.ceil(count / perPage),
      count,
    };
  }

  getPublic(user: UserDocument | User): PublicUser;
  getPublic(user: UserDocument | User | null): PublicUser | null;
  getPublic(user: UserDocument | User | null): PublicUser | null {
    if (!user) return null;

    const obj = typeof (user as any).toObject === 'function' ? (user as any).toObject() : { ...user };
    const { passwordHash: _, ...publicUser } = obj;
    return publicUser;
  }
}
