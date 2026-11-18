import { Body, Controller, Get, Header, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import type { ClientInfo } from '../auth/auth.service.js';
import { CurrentUser, RequirePermission } from '../auth/decorators.js';
import { ZodPipe } from '../common/zod.pipe.js';
import {
  blockCenterSchema,
  createCenterSchema,
  idParamSchema,
  listCentersSchema,
  resetOwnerPasswordSchema,
  updateCenterSchema,
} from './centers.schemas.js';
import { CentersService } from './centers.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Platforma darajasi: faqat super admin (ruxsat kodlari rolga qat'iy biriktirilgan). */
@Controller('admin/centers')
export class CentersController {
  constructor(private readonly centers: CentersService) {}

  // Javobda vaqtinchalik parol bor: kesh va oraliq saqlashga yo'l qo'yilmaydi.
  @RequirePermission('center.create', 'owner.create')
  @Header('Cache-Control', 'no-store')
  @Post()
  create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(createCenterSchema)) body: z.infer<typeof createCenterSchema>,
    @Req() req: Request,
  ) {
    return this.centers.create(actor, body, clientOf(req));
  }

  @RequirePermission('center.edit')
  @Get()
  list(@Query(new ZodPipe(listCentersSchema)) query: z.infer<typeof listCentersSchema>) {
    return this.centers.list(query);
  }

  @RequirePermission('center.edit')
  @Get(':id')
  get(@Param('id', id()) centerId: string) {
    return this.centers.get(centerId);
  }

  @RequirePermission('center.edit')
  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) centerId: string,
    @Body(new ZodPipe(updateCenterSchema)) body: z.infer<typeof updateCenterSchema>,
    @Req() req: Request,
  ) {
    return this.centers.update(actor, centerId, body, clientOf(req));
  }

  @RequirePermission('center.block')
  @HttpCode(200)
  @Post(':id/block')
  block(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) centerId: string,
    @Body(new ZodPipe(blockCenterSchema)) body: z.infer<typeof blockCenterSchema>,
    @Req() req: Request,
  ) {
    return this.centers.block(actor, centerId, body.reason, clientOf(req));
  }

  @RequirePermission('center.block')
  @HttpCode(200)
  @Post(':id/unblock')
  unblock(@CurrentUser() actor: AuthUser, @Param('id', id()) centerId: string, @Req() req: Request) {
    return this.centers.unblock(actor, centerId, clientOf(req));
  }

  @RequirePermission('owner.reset_password')
  @Header('Cache-Control', 'no-store')
  @HttpCode(200)
  @Post(':id/owner/reset-password')
  resetOwnerPassword(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) centerId: string,
    @Body(new ZodPipe(resetOwnerPasswordSchema)) body: z.infer<typeof resetOwnerPasswordSchema>,
    @Req() req: Request,
  ) {
    return this.centers.resetOwnerPassword(actor, centerId, body.userId, clientOf(req));
  }
}
