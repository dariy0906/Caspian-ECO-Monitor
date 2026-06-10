import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarketListing } from '../../market/entities/market-listing.entity';
import { User } from '../../users/user.entity';

export type CatchVerificationStatus = 'pending' | 'approved' | 'rejected';
export type MarketStatus = 'not_listed' | 'listed' | 'sold';

@Entity('catches')
export class Catch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 80 })
  fishType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weight: number;

  @Column({ type: 'varchar', length: 120 })
  locationName: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 80, default: '🐟' })
  fishImage: string;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  verificationStatus: CatchVerificationStatus;

  @Column({ type: 'varchar', length: 30, default: 'not_listed' })
  marketStatus: MarketStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  inspectorComment: string | null;

  @OneToMany(() => MarketListing, (listing) => listing.catch)
  listings: MarketListing[];
}
