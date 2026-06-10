import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { Report, ReportStatus } from './entities/report.entity';

@Injectable()
export class ReportsService implements OnModuleInit {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
  ) {}

  async onModuleInit() {
    const count = await this.reportsRepository.count();
    if (count > 0) {
      return;
    }

    await this.reportsRepository.save([
      {
        type: 'pollution',
        title: 'Oil sheen near Aktau port',
        description: 'Thin dark film visible on the water close to the shore.',
        latitude: 43.6511,
        longitude: 51.1975,
        status: 'verified',
      },
      {
        type: 'dead_fish',
        title: 'Dead fish on Aktau beach',
        description: 'Several small fish washed ashore after strong wind.',
        latitude: 43.6357,
        longitude: 51.1548,
        status: 'new',
      },
      {
        type: 'illegal_nets',
        title: 'Possible illegal nets near Akshukyr',
        description: 'Long unattended net line spotted by local residents.',
        latitude: 43.7992,
        longitude: 51.0646,
        status: 'verified',
      },
      {
        type: 'trash',
        title: 'Plastic trash near Telman',
        description: 'Bottles and bags concentrated along a small coastal area.',
        latitude: 43.7167,
        longitude: 51.1167,
        status: 'new',
      },
      {
        type: 'pollution',
        title: 'Suspicious discharge in Caspian Sea',
        description: 'Gray water patch reported offshore during patrol route.',
        latitude: 43.5389,
        longitude: 51.0172,
        status: 'resolved',
      },
    ]);
  }

  create(createReportDto: CreateReportDto) {
    const report = this.reportsRepository.create({
      ...createReportDto,
      status: 'new',
    });

    return this.reportsRepository.save(report);
  }

  findAll() {
    return this.reportsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getStats() {
    const reports = await this.reportsRepository.find();

    return {
      total: reports.length,
      byType: reports.reduce<Record<string, number>>((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {}),
      byStatus: reports.reduce<Record<string, number>>((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      }, {}),
      latest: reports
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3),
    };
  }

  async updateStatus(id: number, status: ReportStatus) {
    const report = await this.reportsRepository.findOneBy({ id });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = status;
    return this.reportsRepository.save(report);
  }
}
