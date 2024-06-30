import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transaction.entity';
import { TransactionsCron } from './transactions.cron';
import { AiModule } from "../ai/ai.module";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), AiModule, SharedModule],
  providers: [TransactionsService, TransactionsCron],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
