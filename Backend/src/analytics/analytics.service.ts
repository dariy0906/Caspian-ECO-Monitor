import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { EcoReport } from '../eco-reports/entities/eco-report.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Catch)
    private readonly catchesRepository: Repository<Catch>,
    @InjectRepository(EcoReport)
    private readonly ecoReportsRepository: Repository<EcoReport>,
  ) {}

  async getAnalytics() {
    const catches = await this.catchesRepository.find();
    const ecoReports = await this.ecoReportsRepository.find();
    const approved = catches.filter((item) => item.verificationStatus === 'approved');
    const pending = catches.filter((item) => item.verificationStatus === 'pending');
    const approvedEcoReports = ecoReports.filter((item) => item.status === 'approved');
    const totalApprovedWeight = approved.reduce(
      (sum, item) => sum + Number(item.weight),
      0,
    );

    return {
      totalApprovedWeight,
      approvedCount: approved.length,
      pendingCount: pending.length,
      ecoReportsCount: ecoReports.length,
      approvedEcoReportsCount: approvedEcoReports.length,
      topFishTypes: this.topCatchBy(approved, 'fishType'),
      topLocations: this.topCatchBy(approved, 'locationName'),
      topComplaintLocations: this.topEcoBy(ecoReports, 'locationName'),
      caspianLoad: this.getLoad(totalApprovedWeight),
      areaInsights: [
        { name: 'Актау', text: 'улов растёт, нагрузка средняя' },
        { name: 'Акшукыр', text: 'меньше рыбы каждый месяц, потому что много улова' },
        { name: 'Тельман', text: 'есть жалобы на загрязнение' },
      ],
    };
  }

  private topCatchBy(catches: Catch[], key: 'fishType' | 'locationName') {
    const totals = catches.reduce<Record<string, number>>((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + Number(item.weight);
      return acc;
    }, {});

    return this.toTopList(totals);
  }

  private topEcoBy(reports: EcoReport[], key: 'locationName') {
    const totals = reports.reduce<Record<string, number>>((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + 1;
      return acc;
    }, {});

    return this.toTopList(totals);
  }

  private toTopList(totals: Record<string, number>) {
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  private getLoad(weight: number) {
    if (weight < 100) {
      return 'низкая';
    }
    if (weight <= 300) {
      return 'средняя';
    }
    return 'высокая';
  }
}
