import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { cancelChargeSchema, createManualChargeSchema, generateBillingSchema, listChargesSchema } from './charges.schemas.js';
import { ChargesService } from './charges.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Moliya ma'lumoti: ustoz kirmaydi. Aniq ruxsatlar (`payment.view`, `debtors.view`, `charge.adjust`) servisda tekshiriladi. */
@Controller()
@Roles('OWNER', 'ADMIN', 'CASHIER')
export class BillingController {
  constructor(private readonly charges: ChargesService) {}

  /** Markaz bo'yicha yetishmayotgan hisob-kitoblarni hozirgacha yaratadi (takroriy chaqirish xavfsiz). */
  @HttpCode(200)
  @Post('billing/generate')
  generate(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(generateBillingSchema)) body: z.infer<typeof generateBillingSchema>, @Req() req: Request) {
    return this.charges.generate(actor, body.asOf, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'STUDENT')
  @Get('charges')
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listChargesSchema)) query: z.infer<typeof listChargesSchema>) {
    return this.charges.list(actor, query);
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'STUDENT')
  @Get('charges/:id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) chargeId: string) {
    return this.charges.get(actor, chargeId);
  }

  @Post('charges')
  createManual(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createManualChargeSchema)) body: z.infer<typeof createManualChargeSchema>, @Req() req: Request) {
    return this.charges.createManual(actor, body, clientOf(req));
  }

  @HttpCode(200)
  @Post('charges/:id/cancel')
  cancel(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) chargeId: string,
    @Body(new ZodPipe(cancelChargeSchema)) body: z.infer<typeof cancelChargeSchema>,
    @Req() req: Request,
  ) {
    return this.charges.cancel(actor, chargeId, body.reason, clientOf(req));
  }
}
