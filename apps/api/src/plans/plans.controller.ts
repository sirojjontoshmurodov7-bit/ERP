import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, RequirePermission } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createPlanSchema, updatePlanSchema } from './plans.schemas.js';
import { PlansService } from './plans.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Platforma darajasi: faqat super admin (`plan.manage`). */
@Controller('admin/plans')
@RequirePermission('plan.manage')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Post()
  create(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createPlanSchema)) body: z.infer<typeof createPlanSchema>, @Req() req: Request) {
    return this.plans.create(actor, body, clientOf(req));
  }

  @Get()
  list() {
    return this.plans.list();
  }

  @Get(':id')
  get(@Param('id', id()) planId: string) {
    return this.plans.get(planId);
  }

  @Patch(':id')
  update(@CurrentUser() actor: AuthUser, @Param('id', id()) planId: string, @Body(new ZodPipe(updatePlanSchema)) body: z.infer<typeof updatePlanSchema>, @Req() req: Request) {
    return this.plans.update(actor, planId, body, clientOf(req));
  }
}
