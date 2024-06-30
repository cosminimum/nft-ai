import { Injectable } from "@nestjs/common";
import { ApiNetworkProvider } from "@multiversx/sdk-network-providers";
import { ConfigService } from "@nestjs/config";
import { UserSigner } from "@multiversx/sdk-wallet/out";
import {
 TransactionPayload,
 Address,
 Transaction,
 TransactionComputer,
 GasEstimator,
 DefaultGasConfiguration,
 TransactionWatcher,
 TransactionsFactoryConfig,
 TransferTransactionsFactory,
 TokenTransfer,
 Token
} from "@multiversx/sdk-core/out";
import * as path from "node:path";
import * as fs from "node:fs";
import { CreateNFTDto } from "../../nft/dto/dto/CreateNFTDto";
import { TransferNFTDto } from "../../nft/dto/dto/TransferNFTDto";
import { ITransactionOnNetwork } from "@multiversx/sdk-core/out/interfaceOfNetwork";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers/out";

@Injectable()
export class ChainService {
 private readonly NFT_NAME = "AI_NFT";
 private readonly QUANTITY = "01";
 private readonly TOKEN_IDENTIFIER = "AINFT-9acb34";
 private readonly ROYALTIES = "03e8";

 constructor(
   private configService: ConfigService
 ) {}

 private getSigner(): UserSigner {
  const address = this.configService.get("OWNER_ADDRESS");
  const data = fs.readFileSync(path.join(process.cwd(), `./wallets/${address}.json`)).toString();
  return UserSigner.fromWallet(JSON.parse(data), this.configService.get("WALLET_PASSWORD"));
 }

 private getProvider(): ProxyNetworkProvider {
  return new ProxyNetworkProvider(this.configService.get('PROXY_NETWORK_PROVIDER'));
 }

 private encodeHex(data: string): string {
    return Buffer.from(data).toString('hex');
 }

 private async getNonce(): Promise<number> {
  const account = await this.getProvider().getAccount(new Address(this.configService.get("OWNER_ADDRESS")));

  return account.nonce;
 }

 async createNFT(createNFTDto: CreateNFTDto): Promise<void> {
  const {
   userAddress,
   attributes,
   uri
  } = createNFTDto;

  const tokenIdentifierHex = this.encodeHex(this.TOKEN_IDENTIFIER);
  const initialQuantityHex = this.QUANTITY;
  const nftNameHex = this.encodeHex(this.NFT_NAME);
  const royaltiesHex = this.ROYALTIES;
  const attributesHex = this.encodeHex(attributes);
  const hashHex = this.encodeHex((Math.random() + 1).toString(36).substring(7));

  const uriHex = this.encodeHex(uri);
  const data = `ESDTNFTCreate@${tokenIdentifierHex}@${initialQuantityHex}@${nftNameHex}@${royaltiesHex}@${hashHex}@${attributesHex}@${uriHex}`;
  const payload = new TransactionPayload(data);

  const transaction = new Transaction({
   nonce: await this.getNonce(),
   sender: new Address(this.configService.get("OWNER_ADDRESS")),
   receiver: new Address(this.configService.get("OWNER_ADDRESS")),
   value: 0,
   gasLimit: this.estimateGas(this.encodeHex(data).length),
   data: payload,
   chainID: this.configService.get("CHAIN_ID"),
  });

  this.sendAndAwait(transaction).then((result: ITransactionOnNetwork) => {
   if (result.isCompleted) {
    this.transferNFT({
     nonce: transaction.nonce,
     receiverAddress: userAddress
    })
   }
  })
 }

 async transferNFT(transferNFTDto: TransferNFTDto) {
  const factoryConfig = new TransactionsFactoryConfig({ chainID: this.configService.get("CHAIN_ID") });
  const factory = new TransferTransactionsFactory({ config: factoryConfig });
  const nonce = BigInt(transferNFTDto.nonce) + BigInt(-1);

  console.log(nonce);
  const transaction = factory.createTransactionForESDTTokenTransfer({
   sender: new Address(this.configService.get("OWNER_ADDRESS")),
   receiver: new Address(transferNFTDto.receiverAddress),
   tokenTransfers: [
    new TokenTransfer({
     token: new Token({ identifier: this.TOKEN_IDENTIFIER, nonce: nonce }),
     amount: 1n
    })
   ]
  });

  return this.sendAndAwait(transaction);
 }

 private async sendAndAwait(transaction: any): Promise<ITransactionOnNetwork> {
  const serializedTx = (new TransactionComputer()).computeBytesForSigning(transaction);

  transaction.signature = await this.getSigner().sign(serializedTx);

  const txHash = await this.getProvider().sendTransaction(transaction);
  console.log(txHash);
  const watcher = new TransactionWatcher({
   getTransaction: async (hash) => {
    return await this.getProvider().getTransaction(hash, true);
   }
  });

  return await watcher.awaitCompleted(txHash);
 }
 private estimateGas(dataLength: number): number {
  return (new GasEstimator(DefaultGasConfiguration)).forESDTNFTTransfer(dataLength) + 50000000;
 }
}