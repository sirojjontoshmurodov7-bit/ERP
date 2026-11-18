import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, RequirePermission, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createBranchSchema, listBranchesSchema, updateBranchSchema } from './branches.schemas.js';
import { BranchesService } from './branches.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @RequirePermission('branch.manage')
  @Post()
  create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(createBranchSchema)) body: z.infer<typeof createBranchSchema>,
    @Req() req: Request,
  ) {
    return this.branches.create(actor, body, clientOf(req));
  }

  /** Qamrov bo'yicha filtrlanadi (rahbar hammasi, qolganlar o'z filiali). O'quvchi ko'rmaydi. */
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER')
  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listBranchesSchema)) query: z.infer<typeof listBranchesSchema>) {
    return this.branches.list(actor, query.includeArchived);
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER')
  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) branchId: string) {
    return this.branches.get(actor, branchId);
  }

  @RequirePermission('branch.manage')
  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) branchId: string,
    @Body(new ZodPipe(updateBranchSchema)) body: z.infer<typeof updateBranchSchema>,
    @Req() req: Request,
  ) {
    return this.branches.update(actor, branchId, body, clientOf(req));
  }

  @RequirePermission('branch.manage')
  @HttpCode(200)
  @Post(':id/archive')
  archive(@CurrentUser() actor: AuthUser, @Param('id', id()) branchId: string, @Req() req: Request) {
    return this.branches.archive(actor, branchId, clientOf(req));
  }

  @RequirePermission('branch.manage')
  @HttpCode(200)
  @Post(':id/unarchive')
  unarchive(@CurrentUser() actor: AuthUser, @Param('id', id()) branchId: string, @Req() req: Request) {
    return this.branches.unarchive(actor, branchId, clientOf(req));
  }
}
