import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { DispatchService } from './dispatch.service.js';
import { NotifyScheduler } from './notify.scheduler.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { TelegramBotService } from './telegram-bot.service.js';
import { TelegramController } from './telegram.controller.js';
import { TelegramPoller } from './telegram.poller.js';
import { HttpTelegramSender, TelegramSender } from './telegram.sender.js';

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [NotificationsController, TelegramController],
  providers: [NotificationsService, DispatchService, TelegramBotService, TelegramPoller, NotifyScheduler, { provide: TelegramSender, useClass: HttpTelegramSender }],
  exports: [DispatchService],
})
export class NotificationsModule {}
