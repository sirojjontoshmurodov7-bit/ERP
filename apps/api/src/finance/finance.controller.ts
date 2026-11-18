import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { ExpensesService } from './expenses.service.js';
import { FinanceReportService } from './finance-report.service.js';
import { createExpenseSchema, listExpensesSchema, reportQuerySchema, voidExpenseSchema } from './finance.schemas.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Xarajat (`expense.manage`) va moliyaviy hisobotlar (`finance.report`): aniq ruxsat va qamrov servislarda tekshiriladi. */
@Controller()
@Roles('OWNER', 'ADMIN', 'CASHIER')
export class FinanceController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly reports: FinanceReportService,
  ) {}

  @Post('expenses')
  create(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createExpenseSchema)) body: z.infer<typeof createExpenseSchema>, @Req() req: Request) {
    return this.expenses.create(actor, body, clientOf(req));
  }

  @Get('expenses')
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listExpensesSchema)) query: z.infer<typeof listExpensesSchema>) {
    return this.expenses.list(actor, query);
  }

  // `categories` `:id` dan oldin bo'lishi shart
  @Get('expenses/categories')
  categories(@CurrentUser() actor: AuthUser) {
    return this.expenses.categories(actor);
  }

  @Get('expenses/:id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) expenseId: string) {
    return this.expenses.get(actor, expenseId);
  }

  @HttpCode(200)
  @Post('expenses/:id/void')
  voidExpense(@CurrentUser() actor: AuthUser, @Param('id', id()) expenseId: string, @Body(new ZodPipe(voidExpenseSchema)) body: z.infer<typeof voidExpenseSchema>, @Req() req: Request) {
    return this.expenses.voidExpense(actor, expenseId, body.reason, clientOf(req));
  }

  @Get('reports/finance/summary')
  summary(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(reportQuerySchema)) query: z.infer<typeof reportQuerySchema>) {
    return this.reports.summary(actor, query);
  }

  @Get('reports/finance/daily')
  daily(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(reportQuerySchema)) query: z.infer<typeof reportQuerySchema>) {
    return this.reports.daily(actor, query);
  }
}
