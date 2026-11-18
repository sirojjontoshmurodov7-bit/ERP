import { Controller, Get, Query } from '@nestjs/common';
import type { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { branchesQuerySchema, overviewQuerySchema } from './reports.schemas.js';
import { ReportsService } from './reports.service.js';

/** Umumiy hisobotlar faqat rahbarga: `report.overview` va `report.branch_compare` servisda ham tekshiriladi. */
@Controller('reports')
@Roles('OWNER')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  overview(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(overviewQuerySchema)) query: z.infer<typeof overviewQuerySchema>) {
    return this.reports.overview(actor, query);
  }

  @Get('branches')
  branches(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(branchesQuerySchema)) query: z.infer<typeof branchesQuerySchema>) {
    return this.reports.branches(actor, query);
  }
}
