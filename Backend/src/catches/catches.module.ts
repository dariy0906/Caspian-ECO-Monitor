import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Catch } from './entities/catch.entity';
import { CatchesController } from './catches.controller';
import { CatchesService } from './catches.service';
import { MarketListing } from '../market/entities/market-listing.entity';
import { SellerReview } from '../market/entities/seller-review.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Catch, MarketListing, SellerReview, User])],
  controllers: [CatchesController],
  providers: [CatchesService],
  exports: [CatchesService],
})
export class CatchesModule {}
