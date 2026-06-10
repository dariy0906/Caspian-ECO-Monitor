import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCatchDto } from './dto/create-catch.dto';
import { Catch } from './entities/catch.entity';
import { MarketListing } from '../market/entities/market-listing.entity';
import { SellerReview } from '../market/entities/seller-review.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CatchesService implements OnModuleInit {
  constructor(
    @InjectRepository(Catch)
    private readonly catchesRepository: Repository<Catch>,
    @InjectRepository(MarketListing)
    private readonly listingsRepository: Repository<MarketListing>,
    @InjectRepository(SellerReview)
    private readonly reviewsRepository: Repository<SellerReview>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.catchesRepository.count();
    if (count > 0) {
      return;
    }

    const fisherman1 = await this.ensureUser('fisherman1@test.com');
    const fisherman2 = await this.ensureUser('fisherman2@test.com');

    const catches = await this.catchesRepository.save([
      {
        userId: fisherman1.id,
        fishType: 'Сазан',
        weight: 72,
        locationName: 'Актау',
        latitude: 43.6511,
        longitude: 51.1975,
        description: 'Утренний улов возле портовой зоны.',
        fishImage: '🐟',
        verificationStatus: 'approved',
        marketStatus: 'listed',
        approvedAt: new Date(),
        inspectorComment: 'Координаты и описание подтверждены.',
      },
      {
        userId: fisherman2.id,
        fishType: 'Кефаль',
        weight: 38,
        locationName: 'Акшукыр',
        latitude: 43.7992,
        longitude: 51.0646,
        description: 'Свежая партия с удобного берега.',
        fishImage: '🐠',
        verificationStatus: 'approved',
        marketStatus: 'listed',
        approvedAt: new Date(),
        inspectorComment: 'Улов подтвержден инспектором.',
      },
      {
        userId: fisherman1.id,
        fishType: 'Судак',
        weight: 145,
        locationName: 'Тельман',
        latitude: 43.7167,
        longitude: 51.1167,
        description: 'Крупный улов, повышенная нагрузка на район.',
        fishImage: '🐡',
        verificationStatus: 'approved',
        marketStatus: 'not_listed',
        approvedAt: new Date(),
        inspectorComment: 'Крупный улов, рекомендуется мониторинг.',
      },
      {
        userId: fisherman1.id,
        fishType: 'Вобла',
        weight: 24,
        locationName: 'Побережье Каспия',
        latitude: 43.5389,
        longitude: 51.0172,
        description: 'Ожидает проверки инспектора.',
        fishImage: '🐟',
        verificationStatus: 'pending',
        marketStatus: 'not_listed',
      },
      {
        userId: fisherman2.id,
        fishType: 'Сазан',
        weight: 58,
        locationName: 'Актау, городская набережная',
        latitude: 43.6258,
        longitude: 51.1514,
        description: 'Фото и координаты переданы на проверку.',
        fishImage: '🐟',
        verificationStatus: 'pending',
        marketStatus: 'not_listed',
      },
    ]);

    const listings = await this.listingsRepository.save([
      {
        catchId: catches[0].id,
        catch: catches[0],
        sellerId: fisherman1.id,
        seller: fisherman1,
        price: 128000,
        status: 'active',
      },
      {
        catchId: catches[1].id,
        catch: catches[1],
        sellerId: fisherman2.id,
        seller: fisherman2,
        price: 61000,
        status: 'active',
      },
    ]);

    await this.reviewsRepository.save([
      {
        sellerId: fisherman1.id,
        seller: fisherman1,
        reviewerEmail: 'restaurant@test.com',
        rating: 5,
        comment: 'Свежий улов и быстрая передача.',
      },
      {
        sellerId: fisherman2.id,
        seller: fisherman2,
        reviewerEmail: 'buyer@test.com',
        rating: 4,
        comment: 'Хорошая кефаль, упаковку можно улучшить.',
      },
    ]);
  }

  findAll(userId?: number) {
    return this.catchesRepository.find({
      where: userId ? { userId } : {},
      order: { createdAt: 'DESC' },
    });
  }

  findApproved() {
    return this.catchesRepository.find({
      where: { verificationStatus: 'approved' },
      order: { createdAt: 'DESC' },
    });
  }

  findPending() {
    return this.catchesRepository.find({
      where: { verificationStatus: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  create(dto: CreateCatchDto) {
    return this.catchesRepository.save(
      this.catchesRepository.create({
        ...dto,
        fishImage: dto.fishImage || '🐟',
        verificationStatus: 'pending',
        marketStatus: 'not_listed',
        approvedAt: null,
        inspectorComment: null,
      }),
    );
  }

  async approve(id: number, inspectorComment?: string) {
    const catchItem = await this.findOne(id);
    catchItem.verificationStatus = 'approved';
    catchItem.approvedAt = new Date();
    catchItem.inspectorComment = inspectorComment || 'Улов подтвержден инспектором.';
    return this.catchesRepository.save(catchItem);
  }

  async reject(id: number, inspectorComment?: string) {
    const catchItem = await this.findOne(id);
    catchItem.verificationStatus = 'rejected';
    catchItem.marketStatus = 'not_listed';
    catchItem.inspectorComment = inspectorComment || 'Улов отклонен инспектором.';
    return this.catchesRepository.save(catchItem);
  }

  private async findOne(id: number) {
    const catchItem = await this.catchesRepository.findOneBy({ id });
    if (!catchItem) {
      throw new NotFoundException('Улов не найден');
    }
    return catchItem;
  }

  private async ensureUser(email: string) {
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      return existing;
    }
    return this.usersRepository.save(
      this.usersRepository.create({ email, role: 'fisherman' }),
    );
  }
}
