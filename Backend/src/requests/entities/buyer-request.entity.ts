import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type BuyerRequestStatus = 'open' | 'accepted' | 'completed';

@Entity('buyer_requests')
export class BuyerRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80 })
  fishType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weightKg: number;

  @Column({ type: 'date' })
  deadline: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  offeredPrice: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 80 })
  buyerName: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  acceptedBy: string | null;

  @Column({ type: 'varchar', length: 30, default: 'open' })
  status: BuyerRequestStatus;

  @CreateDateColumn()
  createdAt: Date;
}
