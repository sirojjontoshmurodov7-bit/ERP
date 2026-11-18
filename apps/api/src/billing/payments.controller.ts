import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createPaymentSchema, listPaymentsSchema, reversePaymentSchema } from './payments.schemas.js';
import { PaymentsService } from './payments.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Aniq ruxsatlar (`payment.create|view|reverse`) servisda tekshiriladi; ustoz kirmaydi. */
@Controller()
@Roles('OWNER', 'ADMIN', 'CASHIER')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('payments')
  create(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createPaymentSchema)) body: z.infer<typeof createPaymentSchema>, @Req() req: Request) {
    return this.payments.create(actor, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'STUDENT')
  @Get('payments')
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listPaymentsSchema)) query: z.infer<typeof listPaymentsSchema>) {
    return this.payments.list(actor, query);
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'STUDENT')
  @Get('payments/:id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) paymentId: string) {
    return this.payments.get(actor, paymentId);
  }

  @HttpCode(200)
  @Post('payments/:id/reverse')
  reverse(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) paymentId: string,
    @Body(new ZodPipe(reversePaymentSchema)) body: z.infer<typeof reversePaymentSchema>,
    @Req() req: Request,
  ) {
    return this.payments.reverse(actor, paymentId, body.reason, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'STUDENT')
  @Get('students/:id/balance')
  balance(@CurrentUser() actor: AuthUser, @Param('id', id()) studentId: string) {
    return this.payments.balance(actor, studentId);
  }
}
