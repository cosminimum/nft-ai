import { Injectable } from '@nestjs/common';
import { ChainService } from "../shared/services/chain.service";
import { CreateRequestDto } from "./dto/dto/CreateRequestDto";

@Injectable()
export class NftService {
  constructor(private readonly chainService: ChainService) {}
  async mintNft(createRequestDto: CreateRequestDto): Promise<void> {
    await this.chainService.createNFT({
      userAddress: createRequestDto.transaction.userAddress,
      attributes: [
        createRequestDto.transaction.category,
        createRequestDto.transaction.timeOfDay,
        createRequestDto.transaction.amount
      ].join(","),
      uri: createRequestDto.url
    });
  }
}
