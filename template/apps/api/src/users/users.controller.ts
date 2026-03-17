import { Body, Controller, Delete, Get, HttpCode, Param, Put, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { AdminGuard } from '../common/guards/admin.guard.js';
import { UsersService } from './users.service.js';

const listSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(10),
  searchValue: z.string().optional(),
  filter: z
    .object({
      createdOn: z
        .object({
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
        })
        .optional(),
    })
    .optional(),
  sort: z
    .object({
      firstName: z.enum(['asc', 'desc']).optional(),
      lastName: z.enum(['asc', 'desc']).optional(),
      createdOn: z.enum(['asc', 'desc']).default('asc'),
    })
    .default({ createdOn: 'asc' }),
});

const updateSchema = z.object({
  firstName: z.string().min(1).max(128).optional(),
  lastName: z.string().min(1).max(128).optional(),
  email: z.email().min(1).toLowerCase().trim().max(255).optional(),
});

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async list(@Query() rawQuery: unknown) {
    const { perPage, page, sort, searchValue, filter } = listSchema.parse(rawQuery);

    const filterOptions: Record<string, unknown>[] = [];

    if (searchValue) {
      const searchFields = ['firstName', 'lastName', 'email'];
      filterOptions.push({
        $or: searchFields.map((field) => ({ [field]: { $regex: searchValue, $options: 'i' } })),
      });
    }

    if (filter?.createdOn) {
      const { startDate, endDate } = filter.createdOn;
      filterOptions.push({
        createdOn: {
          ...(startDate && { $gte: startDate }),
          ...(endDate && { $lt: endDate }),
        },
      });
    }

    const result = await this.usersService.find(
      filterOptions.length ? { $and: filterOptions } : {},
      { page, perPage },
      { sort },
    );

    return {
      ...result,
      results: result.results.map((u) => this.usersService.getPublic(u)),
    };
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id') id: string, @Body() rawBody: unknown) {
    const body = updateSchema.parse(rawBody);
    const updatedUser = await this.usersService.updateOne({ _id: id }, body);
    return this.usersService.getPublic(updatedUser);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.usersService.softDelete({ _id: id });
  }
}
