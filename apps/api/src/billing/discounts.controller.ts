import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { DebtorsService } from './debtors.service.js';
import { createDiscountSchema, endDiscountSchema, listDebtorsSchema } from './discounts.schemas.js';
import { DiscountsService } from './discounts.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Chegirmalar (`discount.grant`) va qarzdorlar (`debtors.view`): aniq ruxsat va qamrov servislarda tekshiriladi. */
@Controller()
@Roles('OWNER', 'ADMIN', 'CASHIER')
export class DiscountsController {
  constructor(
    private readonly discounts: DiscountsService,
    private readonly debtors: DebtorsService,
  ) {}

  @Post('enrollments/:id/discounts')
  grant(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) enrollmentId: string,
    @Body(new ZodPipe(createDiscountSchema)) body: z.infer<typeof createDiscountSchema>,
    @Req() req: Request,
  ) {
    return this.discounts.grant(actor, enrollmentId, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'STUDENT')
  @Get('enrollments/:id/discounts')
  list(@CurrentUser() actor: AuthUser, @Param('id', id()) enrollmentId: string) {
    return this.discounts.list(actor, enrollmentId);
  }

  @HttpCode(200)
  @Post('discounts/:id/end')
  end(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) discountId: string,
    @Body(new ZodPipe(endDiscountSchema)) body: z.infer<typeof endDiscountSchema>,
    @Req() req: Request,
  ) {
    return this.discounts.end(actor, discountId, body.toDate, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  @Get('debtors')
  debtorsList(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listDebtorsSchema)) query: z.infer<typeof listDebtorsSchema>) {
    return this.debtors.list(actor, query);
  }
}
