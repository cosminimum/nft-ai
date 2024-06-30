import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { SharedModule } from "../shared/shared.module";
import { NftController } from "./nft.controller";

@Module({
  imports: [SharedModule],
  providers: [NftService],
  controllers: [NftController],
})
export class NftModule {}
