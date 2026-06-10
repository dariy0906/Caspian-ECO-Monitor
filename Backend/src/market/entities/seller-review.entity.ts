import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarketListing } from './market-listing.entity';
import { User } from '../../users/user.entity';

@Entity('seller_reviews')
export class SellerReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 80 })
  reviewerEmail: string;

  @Column({ type: 'varchar', length: 240 })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MarketListing, (listing) => listing.reviews, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  listing: MarketListing | null;
}
