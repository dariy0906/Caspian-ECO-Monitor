import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { User } from '../users/user.entity';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketListing } from './entities/market-listing.entity';
import { MarketRequest } from './entities/market-request.entity';
import { SellerReview } from './entities/seller-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Catch, MarketListing, MarketRequest, SellerReview, User])],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}
