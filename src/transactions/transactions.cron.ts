import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsService } from './transactions.service';
import { QueueService } from "../shared/services/queue.service";

@Injectable()
export class TransactionsCron {
  private readonly queueName = 'transactions';
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly queueService: QueueService,
  ) {}

  @Cron('0 0 1 * *')
  async handleCron() {
    const transactions = await this.transactionsService.findEligibleTransactions();
    for (const transaction of transactions) {
      await this.queueService.sendToQueue(this.queueName, transaction);
    }
  }
}
