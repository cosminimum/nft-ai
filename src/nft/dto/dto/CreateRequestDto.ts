import { Transaction } from "../../../transactions/transaction.entity";

export class CreateRequestDto {
  url: string;
  transaction: Transaction;
}