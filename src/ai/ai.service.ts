import { Injectable, OnModuleInit } from '@nestjs/common';
import { spawn } from 'child_process';
import { QueueService } from '../shared/services/queue.service';
import { Transaction } from "../transactions/transaction.entity";
@Injectable()
export class AiService implements OnModuleInit {
  private readonly queueName = 'transactions';

  constructor(
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    await this.queueService.consumeQueue(this.queueName, async (transaction) => {
      await this.processTransaction(transaction);
    });
  }

  async processTransaction(transaction: Transaction): Promise<void> {
    const pythonProcess = spawn('python3', ['scripts/generate.py', JSON.stringify(transaction)]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
}