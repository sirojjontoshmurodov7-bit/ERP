import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { PayoutsService } from './payouts.service.js';
import { PayrollRulesService } from './payroll-rules.service.js';
import { PayrollService } from './payroll.service.js';
import {
  createAdjustmentSchema,
  createPayoutSchema,
  createRuleSchema,
  endRuleSchema,
  listPayoutsSchema,
  listPeriodsSchema,
  listRulesSchema,
  monthParamSchema,
  reversePayoutSchema,
  updateRuleSchema,
} from './payroll.schemas.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);
const month = () => new ZodPipe(monthParamSchema.shape.month);

/** Maosh: aniq ruxsatlar (`payroll.*`) servislarda tekshiriladi; o'quvchi kirmaydi. */
@Controller('payroll')
@Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER')
export class PayrollController {
  constructor(
    private readonly rules: PayrollRulesService,
    private readonly payroll: PayrollService,
    private readonly payouts: PayoutsService,
  ) {}

  // --- qoidalar
  @Post('rules')
  createRule(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createRuleSchema)) body: z.infer<typeof createRuleSchema>, @Req() req: Request) {
    return this.rules.create(actor, body, clientOf(req));
  }

  @Get('rules')
  listRules(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listRulesSchema)) query: z.infer<typeof listRulesSchema>) {
    return this.rules.list(actor, query);
  }

  @Patch('rules/:id')
  updateRule(@CurrentUser() actor: AuthUser, @Param('id', id()) ruleId: string, @Body(new ZodPipe(updateRuleSchema)) body: z.infer<typeof updateRuleSchema>, @Req() req: Request) {
    return this.rules.update(actor, ruleId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post('rules/:id/end')
  endRule(@CurrentUser() actor: AuthUser, @Param('id', id()) ruleId: string, @Body(new ZodPipe(endRuleSchema)) body: z.infer<typeof endRuleSchema>, @Req() req: Request) {
    return this.rules.end(actor, ruleId, body.validTo, clientOf(req));
  }

  // --- davrlar
  @Get('periods')
  listPeriods(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listPeriodsSchema)) query: z.infer<typeof listPeriodsSchema>) {
    return this.payroll.list(actor, query);
  }

  @Get('periods/:month')
  getPeriod(@CurrentUser() actor: AuthUser, @Param('month', month()) m: string) {
    return this.payroll.get(actor, m);
  }

  @HttpCode(200)
  @Post('periods/:month/calculate')
  calculate(@CurrentUser() actor: AuthUser, @Param('month', month()) m: string, @Req() req: Request) {
    return this.payroll.calculate(actor, m, clientOf(req));
  }

  @HttpCode(200)
  @Post('periods/:month/approve')
  approve(@CurrentUser() actor: AuthUser, @Param('month', month()) m: string, @Req() req: Request) {
    return this.payroll.approve(actor, m, clientOf(req));
  }

  @Post('periods/:month/adjustments')
  addAdjustment(@CurrentUser() actor: AuthUser, @Param('month', month()) m: string, @Body(new ZodPipe(createAdjustmentSchema)) body: z.infer<typeof createAdjustmentSchema>, @Req() req: Request) {
    return this.payroll.addAdjustment(actor, m, body, clientOf(req));
  }

  @Delete('adjustments/:id')
  removeAdjustment(@CurrentUser() actor: AuthUser, @Param('id', id()) adjustmentId: string, @Req() req: Request) {
    return this.payroll.removeAdjustment(actor, adjustmentId, clientOf(req));
  }

  // --- o'z maoshi
  @Get('me')
  me(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listPeriodsSchema)) query: z.infer<typeof listPeriodsSchema>) {
    return this.payroll.me(actor, query);
  }

  // --- to'lovlar
  @Post('payouts')
  createPayout(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createPayoutSchema)) body: z.infer<typeof createPayoutSchema>, @Req() req: Request) {
    return this.payouts.create(actor, body, clientOf(req));
  }

  @Get('payouts')
  listPayouts(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listPayoutsSchema)) query: z.infer<typeof listPayoutsSchema>) {
    return this.payouts.list(actor, query);
  }

  @HttpCode(200)
  @Post('payouts/:id/reverse')
  reversePayout(@CurrentUser() actor: AuthUser, @Param('id', id()) payoutId: string, @Body(new ZodPipe(reversePayoutSchema)) body: z.infer<typeof reversePayoutSchema>, @Req() req: Request) {
    return this.payouts.reverse(actor, payoutId, body.reason, clientOf(req));
  }
}
