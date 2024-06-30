import { Module } from '@nestjs/common';
import { QueueService } from "./services/queue.service";
import { ChainService } from "./services/chain.service";

@Module({
  providers: [QueueService, ChainService],
  exports: [QueueService, ChainService]
})
export class SharedModule {}
