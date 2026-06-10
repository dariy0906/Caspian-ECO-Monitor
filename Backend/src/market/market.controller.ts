import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateMarketRequestDto } from './dto/create-market-request.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get()
  findAll() {
    return this.marketService.findAll();
  }

  @Post('listing')
  create(@Body() dto: CreateListingDto) {
    return this.marketService.create(dto);
  }

  @Post('requests')
  createRequest(@Body() dto: CreateMarketRequestDto) {
    return this.marketService.createRequest(dto);
  }

  @Get('requests')
  getRequests() {
    return this.marketService.getRequests();
  }

  @Post(':listingId/review')
  addReview(@Param('listingId') listingId: string, @Body() dto: CreateReviewDto) {
    return this.marketService.addReview(+listingId, dto);
  }
}
