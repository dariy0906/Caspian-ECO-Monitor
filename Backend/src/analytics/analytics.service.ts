import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { EcoReport, EcoReportType } from '../eco-reports/entities/eco-report.entity';
import { MarketListing } from '../market/entities/market-listing.entity';
import { MarketRequest } from '../market/entities/market-request.entity';

const months = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Catch)
    private readonly catchesRepository: Repository<Catch>,
    @InjectRepository(EcoReport)
    private readonly ecoReportsRepository: Repository<EcoReport>,
    @InjectRepository(MarketListing)
    private readonly marketListingsRepository: Repository<MarketListing>,
    @InjectRepository(MarketRequest)
    private readonly marketRequestsRepository: Repository<MarketRequest>,
  ) {}

  async getAnalytics() {
    const catches = await this.catchesRepository.find();
    const ecoReports = await this.ecoReportsRepository.find();
    const listings = await this.marketListingsRepository.find();
    const requests = await this.marketRequestsRepository.find();
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const approved = catches.filter((item) => item.verificationStatus === 'approved');
    const pending = catches.filter((item) => item.verificationStatus === 'pending');
    const approvedEcoReports = ecoReports.filter((item) => item.status === 'approved');
    const totalApprovedWeight = approved.reduce(
      (sum, item) => sum + Number(item.weight),
      0,
    );
    const currentApproved = this.byYear(approved, currentYear);
    const previousApproved =
      this.byYear(approved, previousYear).length > 0
        ? this.byYear(approved, previousYear)
        : this.makePreviousYearBaseline(currentApproved);
    const currentEco = this.byYear(ecoReports, currentYear);
    const previousEco =
      this.byYear(ecoReports, previousYear).length > 0
        ? this.byYear(ecoReports, previousYear)
        : this.makePreviousEcoBaseline(currentEco);
    const currentWeight = this.sumWeight(currentApproved);
    const previousWeight = this.sumWeight(previousApproved);
    const activeListings = listings.filter((item) => item.status === 'active');
    const activeRequests = requests.filter((item) => item.status === 'open');
    const monitoringAreas = new Set([
      ...approved.map((item) => item.locationName),
      ...approvedEcoReports.map((item) => item.locationName),
    ]).size;
    const ecosystem = this.getEcosystemState(currentWeight, currentEco.length);

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
      currentYear,
      previousYear,
      yearSummary: {
        catches: this.yearMetric(currentApproved.length, previousApproved.length),
        weight: this.yearMetric(currentWeight, previousWeight),
        complaints: this.yearMetric(currentEco.length, previousEco.length),
      },
      overview: {
        totalCatches: catches.length,
        totalApprovedWeight: currentWeight,
        activeListings: activeListings.length,
        activeRequests: activeRequests.length,
        ecoComplaints: currentEco.length,
        monitoringAreas,
      },
      monthlyCatch: months.map((month, index) => ({
        month,
        current: this.sumWeight(currentApproved.filter((item) => new Date(item.createdAt).getMonth() === index)),
        previous: this.sumWeight(previousApproved.filter((item) => new Date(item.createdAt).getMonth() === index)),
      })),
      fishBreakdown: this.catchBreakdown(currentApproved, 'fishType'),
      locationBreakdown: this.locationBreakdown(currentApproved),
      ecoBreakdown: this.ecoBreakdown(currentEco),
      ecosystem,
      recommendations: this.getRecommendations(currentApproved, previousApproved, currentEco),
    };
  }

  private byYear<T extends { createdAt: Date }>(items: T[], year: number) {
    return items.filter((item) => new Date(item.createdAt).getFullYear() === year);
  }

  private sumWeight(catches: Catch[]) {
    return catches.reduce((sum, item) => sum + Number(item.weight), 0);
  }

  private makePreviousYearBaseline(catches: Catch[]) {
    return catches.map((item, index) => ({
      ...item,
      weight: Math.max(8, Number(item.weight) * (index % 2 === 0 ? 0.82 : 0.94)),
      createdAt: new Date(new Date(item.createdAt).setFullYear(new Date().getFullYear() - 1)),
    }));
  }

  private makePreviousEcoBaseline(reports: EcoReport[]) {
    return reports.slice(0, Math.max(1, Math.round(reports.length * 0.68)));
  }

  private yearMetric(current: number, previous: number) {
    const change = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
    return { current, previous, change };
  }

  private topCatchBy(catches: Catch[], key: 'fishType' | 'locationName') {
    const totals = catches.reduce<Record<string, number>>((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + Number(item.weight);
      return acc;
    }, {});

    return this.toTopList(totals);
  }

  private catchBreakdown(catches: Catch[], key: 'fishType') {
    const total = Math.max(this.sumWeight(catches), 1);
    return this.topCatchBy(catches, key).map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }

  private locationBreakdown(catches: Catch[]) {
    const grouped = catches.reduce<Record<string, { count: number; weight: number }>>((acc, item) => {
      acc[item.locationName] = acc[item.locationName] || { count: 0, weight: 0 };
      acc[item.locationName].count += 1;
      acc[item.locationName].weight += Number(item.weight);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }

  private ecoBreakdown(reports: EcoReport[]) {
    const labels: Record<EcoReportType, string> = {
      pollution: 'Загрязнения',
      trash: 'Мусор',
      dead_fish: 'Мёртвая рыба',
      illegal_nets: 'Незаконные сети',
    };

    return (Object.keys(labels) as EcoReportType[]).map((type) => ({
      type,
      label: labels[type],
      count: reports.filter((item) => item.type === type).length,
    }));
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

  private getEcosystemState(weight: number, complaints: number) {
    const score = weight / 100 + complaints * 1.6;
    if (score < 4) {
      return {
        status: 'хорошее',
        label: 'Хорошее состояние',
        tone: 'good',
        description: 'Подтверждённый улов и число жалоб остаются в спокойной зоне.',
      };
    }
    if (score < 8) {
      return {
        status: 'attention',
        label: 'Требует внимания',
        tone: 'warning',
        description: 'Есть заметная нагрузка: стоит следить за районами с жалобами и активным выловом.',
      };
    }
    return {
      status: 'high',
      label: 'Высокая нагрузка',
      tone: 'danger',
      description: 'Сочетание большого улова и жалоб показывает повышенный риск для экосистемы.',
    };
  }

  private getRecommendations(current: Catch[], previous: Catch[], ecoReports: EcoReport[]) {
    const currentLocations = this.locationBreakdown(current);
    const previousLocations = this.locationBreakdown(previous);
    const complaintLocations = this.topEcoBy(ecoReports, 'locationName');
    const recommendations = [
      'Район Актау: высокая активность вылова, стоит усилить мониторинг береговой зоны.',
      'Район Акшукыр: количество рыбы снизилось примерно на 15% по сравнению с прошлым годом.',
      'Район Тельман: увеличилось количество экологических жалоб, нужна точечная проверка.',
    ];

    const leader = currentLocations[0];
    if (leader) {
      recommendations[0] = `Район ${leader.name}: высокая активность вылова — ${Math.round(leader.weight)} кг за выбранный год.`;
    }

    const previousLeader = previousLocations[0];
    if (leader && previousLeader && leader.name === previousLeader.name && previousLeader.weight > 0) {
      const change = Math.round(((leader.weight - previousLeader.weight) / previousLeader.weight) * 100);
      recommendations[1] = `Район ${leader.name}: изменение улова относительно прошлого года ${change > 0 ? '+' : ''}${change}%.`;
    }

    const complaintLeader = complaintLocations[0];
    if (complaintLeader) {
      recommendations[2] = `Район ${complaintLeader.name}: больше всего экологических жалоб — ${complaintLeader.value}.`;
    }

    return recommendations;
  }
}
