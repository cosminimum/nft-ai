import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { Transaction } from "../transactions/transaction.entity";

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('process')
  async processTransaction(@Body() transaction: Transaction) {
    return this.aiService.processTransaction(transaction);
  }
}
