import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateEcoReportDto } from './dto/create-eco-report.dto';
import { EcoReport } from './entities/eco-report.entity';

@Injectable()
export class EcoReportsService implements OnModuleInit {
  constructor(
    @InjectRepository(EcoReport)
    private readonly reportsRepository: Repository<EcoReport>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.reportsRepository.count();
    if (count > 0) {
      return;
    }

    const user = await this.ensureUser('fisherman1@test.com');
    await this.reportsRepository.save([
      {
        userId: user.id,
        type: 'pollution',
        title: 'Загрязнение возле Актау',
        description: 'На поверхности воды замечена масляная пленка.',
        latitude: 43.6357,
        longitude: 51.1548,
        locationName: 'Актау',
        status: 'approved',
        inspectorComment: 'Местность грязная, требуется проверка.',
        approvedAt: new Date(),
      },
      {
        userId: user.id,
        type: 'trash',
        title: 'Мусор возле Акшукыра',
        description: 'Пластик и пакеты на берегу.',
        latitude: 43.7992,
        longitude: 51.0646,
        locationName: 'Акшукыр',
        status: 'approved',
        inspectorComment: 'Подтверждено, нужна уборка берега.',
        approvedAt: new Date(),
      },
      {
        userId: user.id,
        type: 'dead_fish',
        title: 'Мертвая рыба возле Тельмана',
        description: 'Несколько рыб на береговой линии.',
        latitude: 43.7167,
        longitude: 51.1167,
        locationName: 'Тельман',
        status: 'pending',
      },
      {
        userId: user.id,
        type: 'illegal_nets',
        title: 'Незаконные сети у побережья',
        description: 'Замечены сети без присмотра.',
        latitude: 43.8451,
        longitude: 50.9821,
        locationName: 'Побережье Каспия',
        status: 'pending',
      },
    ]);
  }

  findAll() {
    return this.reportsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findPending() {
    return this.reportsRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  findApproved() {
    return this.reportsRepository.find({
      where: { status: 'approved' },
      order: { approvedAt: 'DESC' },
    });
  }

  create(dto: CreateEcoReportDto) {
    return this.reportsRepository.save(
      this.reportsRepository.create({
        ...dto,
        status: 'pending',
        inspectorComment: null,
        approvedAt: null,
      }),
    );
  }

  async approve(id: number, inspectorComment?: string) {
    const report = await this.findOne(id);
    report.status = 'approved';
    report.inspectorComment = inspectorComment || 'Заявка подтверждена инспектором.';
    report.approvedAt = new Date();
    return this.reportsRepository.save(report);
  }

  async reject(id: number, inspectorComment?: string) {
    const report = await this.findOne(id);
    report.status = 'rejected';
    report.inspectorComment = inspectorComment || 'Заявка отклонена инспектором.';
    return this.reportsRepository.save(report);
  }

  private async findOne(id: number) {
    const report = await this.reportsRepository.findOneBy({ id });
    if (!report) {
      throw new NotFoundException('Экологическая заявка не найдена');
    }
    return report;
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
