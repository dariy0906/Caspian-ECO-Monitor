import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { CreateBuyerRequestDto } from './dto/create-buyer-request.dto';
import { BuyerRequest } from './entities/buyer-request.entity';

@Injectable()
export class RequestsService implements OnModuleInit {
  constructor(
    @InjectRepository(BuyerRequest)
    private readonly requestsRepository: Repository<BuyerRequest>,
  ) {}

  async onModuleInit() {
    const count = await this.requestsRepository.count();
    if (count > 0) {
      return;
    }

    await this.requestsRepository.save([
      {
        fishType: 'Судак',
        weightKg: 50,
        deadline: '2026-06-15',
        offeredPrice: 90000,
        description: 'Нужна охлажденная партия для ресторана.',
        buyerName: 'Ресторан Nomad Sea',
        acceptedBy: null,
        status: 'open',
      },
      {
        fishType: 'Кефаль',
        weightKg: 30,
        deadline: '2026-06-13',
        offeredPrice: 52000,
        description: 'Покупка с доставкой по Актау.',
        buyerName: 'Кафе Жағалау',
        acceptedBy: null,
        status: 'open',
      },
      {
        fishType: 'Сазан',
        weightKg: 20,
        deadline: '2026-06-12',
        offeredPrice: 31000,
        description: 'Партия для витрины, размер средний.',
        buyerName: 'Рынок 7 микрорайон',
        acceptedBy: 'Ерлан К.',
        status: 'accepted',
      },
    ]);
  }

  findAll() {
    return this.requestsRepository.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateBuyerRequestDto) {
    return this.requestsRepository.save(
      this.requestsRepository.create({
        ...dto,
        acceptedBy: null,
        status: 'open',
      }),
    );
  }

  async accept(id: number, dto: AcceptRequestDto) {
    const request = await this.findOne(id);
    request.status = 'accepted';
    request.acceptedBy = dto.sellerName;
    return this.requestsRepository.save(request);
  }

  async complete(id: number) {
    const request = await this.findOne(id);
    request.status = 'completed';
    return this.requestsRepository.save(request);
  }

  private async findOne(id: number) {
    const request = await this.requestsRepository.findOneBy({ id });
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }
    return request;
  }
}
