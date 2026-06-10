import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Catch } from '../../catches/entities/catch.entity';
import { User } from '../../users/user.entity';
import { SellerReview } from './seller-review.entity';

export type ListingStatus = 'active' | 'sold' | 'cancelled';

@Entity('market_listings')
export class MarketListing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Catch, (catchItem) => catchItem.listings, { eager: true })
  @JoinColumn({ name: 'catchId' })
  catch: Catch;

  @Column()
  catchId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: ListingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => SellerReview, (review) => review.listing)
  reviews: SellerReview[];
}
