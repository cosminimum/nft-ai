import { Controller, Post, Body } from '@nestjs/common';
import { NftService } from './nft.service';
import { CreateRequestDto } from "./dto/dto/CreateRequestDto";

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post('mint')
  async mintNft(@Body() createRequestDto: CreateRequestDto) {
    return this.nftService.mintNft(createRequestDto);
  }
}
