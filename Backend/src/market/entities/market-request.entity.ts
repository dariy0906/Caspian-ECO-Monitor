import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MarketRequestStatus = 'open' | 'accepted' | 'completed';

@Entity('market_requests')
export class MarketRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 160 })
  requesterEmail: string;

  @Column({ type: 'varchar', length: 80 })
  fishType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weight: number;

  @Column({ type: 'date' })
  deadline: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  offeredPrice: number;

  @Column({ type: 'varchar', length: 120 })
  locationName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 30, default: 'open' })
  status: MarketRequestStatus;

  @CreateDateColumn()
  createdAt: Date;
}
