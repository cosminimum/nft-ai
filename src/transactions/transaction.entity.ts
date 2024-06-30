import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAddress: string;

  @Column()
  category: string;

  @Column('decimal')
  amount: number;

  @Column()
  timeOfDay: string;

  @Column()
  date: Date;
}
