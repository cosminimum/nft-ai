import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Transaction } from './transaction.entity';
import { QueueService } from "../shared/services/queue.service";

@Injectable()
export class TransactionsService {
  private readonly queueName = 'transactions';

  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private readonly queueService: QueueService,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find();
  }

  async findEligibleTransactions(): Promise<any[]> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const transactions = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.timestamp > :date', { date: oneMonthAgo })
      .getMany();

    const users: { [userAddress: string]: UserDataInterface } = {};

    for (const transaction of transactions) {
      if (!users[transaction.userAddress]) {
        users[transaction.userAddress] = {
          totalAmount: 0,
          transactionCount: 0,
          categories: {},
          timeOfDay: {},
        };
      }

      const user = users[transaction.userAddress];
      user.totalAmount += transaction.amount;
      user.transactionCount += 1;

      if (!user.categories[transaction.category]) {
        user.categories[transaction.category] = {
          totalAmount: 0,
          transactionCount: 0,
        };
      }

      user.categories[transaction.category].totalAmount += transaction.amount;
      user.categories[transaction.category].transactionCount += 1;

      const hour = new Date(transaction.date).getHours();
      if (!user.timeOfDay[hour]) {
        user.timeOfDay[hour] = 0;
      }
      user.timeOfDay[hour] += 1;
    }

    const computedTransactions = [];

    for (const [userAddress, data] of Object.entries(users)) {
      if (data.transactionCount >= 10 && data.totalAmount >= 5 * 10) {
        const mostCommonCategory = Object.keys(data.categories).reduce((a, b) =>
          data.categories[a].transactionCount > data.categories[b].transactionCount ? a : b
        );

        const mostActiveHour = Object.keys(data.timeOfDay).reduce((a, b) =>
          data.timeOfDay[+a] > data.timeOfDay[+b] ? a : b
        );

        computedTransactions.push({
          userAddress,
          mostCommonCategory,
          mostActiveHour,
          totalAmount: data.totalAmount,
          transactionCount: data.transactionCount,
        });
      }
    }

    return computedTransactions;
  }

  async create(transaction: Transaction): Promise<void> {
    await this.transactionsRepository.save(transaction);
    await this.queueService.sendToQueue(this.queueName, transaction);
  }
}
