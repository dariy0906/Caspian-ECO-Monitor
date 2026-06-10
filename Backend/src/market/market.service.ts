import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { User } from '../users/user.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateMarketRequestDto } from './dto/create-market-request.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { MarketListing } from './entities/market-listing.entity';
import { MarketRequest } from './entities/market-request.entity';
import { SellerReview } from './entities/seller-review.entity';

@Injectable()
export class MarketService implements OnModuleInit {
  constructor(
    @InjectRepository(MarketListing)
    private readonly listingsRepository: Repository<MarketListing>,
    @InjectRepository(SellerReview)
    private readonly reviewsRepository: Repository<SellerReview>,
    @InjectRepository(MarketRequest)
    private readonly requestsRepository: Repository<MarketRequest>,
    @InjectRepository(Catch)
    private readonly catchesRepository: Repository<Catch>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.requestsRepository.count();
    if (count > 0) {
      return;
    }

    await this.requestsRepository.save([
      {
        requesterEmail: 'restaurant@test.com',
        fishType: 'Сазан',
        weight: 15,
        deadline: '2026-06-20',
        offeredPrice: 42000,
        locationName: 'Актау',
        description: 'Нужно 15 кг сазана до 20 июня, район Актау.',
        status: 'open',
      },
      {
        requesterEmail: 'market@test.com',
        fishType: 'Судак',
        weight: 40,
        deadline: '2026-06-22',
        offeredPrice: 87000,
        locationName: 'Акшукыр',
        description: 'Нужна свежая партия для витрины.',
        status: 'open',
      },
    ]);
  }

  async findAll() {
    const listings = await this.listingsRepository.find({
      order: { createdAt: 'DESC' },
    });
    const reviews = await this.reviewsRepository.find();

    return listings.map((listing) => {
      const sellerReviews = reviews.filter((review) => review.sellerId === listing.sellerId);
      const rating = sellerReviews.length
        ? sellerReviews.reduce((sum, review) => sum + Number(review.rating), 0) / sellerReviews.length
        : 5;

      return {
        ...listing,
        sellerRating: Number(rating.toFixed(1)),
        reviews: sellerReviews,
      };
    });
  }

  async create(dto: CreateListingDto) {
    const catchItem = await this.catchesRepository.findOneBy({ id: dto.catchId });
    if (!catchItem) {
      throw new NotFoundException('Улов не найден');
    }
    if (catchItem.verificationStatus !== 'approved') {
      throw new BadRequestException('На рынок можно выставить только подтвержденный улов');
    }
    if (catchItem.marketStatus === 'sold') {
      throw new BadRequestException('Проданный улов нельзя выставить');
    }
    if (catchItem.marketStatus === 'listed') {
      throw new BadRequestException('Улов уже выставлен на рынок');
    }

    const seller = await this.usersRepository.findOneBy({ id: dto.sellerId });
    if (!seller) {
      throw new NotFoundException('Продавец не найден');
    }

    catchItem.marketStatus = 'listed';
    await this.catchesRepository.save(catchItem);

    return this.listingsRepository.save(
      this.listingsRepository.create({
        catchId: catchItem.id,
        catch: catchItem,
        sellerId: seller.id,
        seller,
        price: dto.price,
        status: 'active',
      }),
    );
  }

  async addReview(listingId: number, dto: CreateReviewDto) {
    const listing = await this.listingsRepository.findOneBy({ id: listingId });
    if (!listing) {
      throw new NotFoundException('Товар не найден');
    }

    return this.reviewsRepository.save(
      this.reviewsRepository.create({
        sellerId: dto.sellerId || listing.sellerId,
        reviewerEmail: dto.reviewerEmail,
        rating: Math.max(1, Math.min(5, Number(dto.rating))),
        comment: dto.comment,
      }),
    );
  }

  getRequests() {
    return this.requestsRepository.find({ order: { createdAt: 'DESC' } });
  }

  createRequest(dto: CreateMarketRequestDto) {
    return this.requestsRepository.save(
      this.requestsRepository.create({
        ...dto,
        status: 'open',
      }),
    );
  }
}
