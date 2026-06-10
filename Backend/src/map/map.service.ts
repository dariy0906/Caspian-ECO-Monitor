import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { EcoReport } from '../eco-reports/entities/eco-report.entity';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Catch)
    private readonly catchesRepository: Repository<Catch>,
    @InjectRepository(EcoReport)
    private readonly ecoReportsRepository: Repository<EcoReport>,
  ) {}

  async getMarkers() {
    const catches = await this.catchesRepository.find({
      where: { verificationStatus: 'approved' },
    });
    const reports = await this.ecoReportsRepository.find({
      where: { status: 'approved' },
    });

    return [
      ...catches.map((item) => ({
        id: `catch-${item.id}`,
        kind: 'catch',
        title: item.locationName,
        markerType: 'Подтвержденный улов',
        latitude: item.latitude,
        longitude: item.longitude,
        pluses: ['много рыбы', 'удобный берег', 'рядом населённый пункт'],
        minuses:
          Number(item.weight) >= 100
            ? ['высокая нагрузка', 'снижение количества рыбы']
            : ['требуется регулярный мониторинг'],
        description: `${item.fishType}, ${item.weight} кг. ${item.description}`,
      })),
      ...reports.map((item) => ({
        id: `eco-${item.id}`,
        kind: 'eco',
        title: item.locationName,
        markerType: this.ecoTypeLabel(item.type),
        latitude: item.latitude,
        longitude: item.longitude,
        pluses: ['есть сигнал от жителей', 'точка проверена инспектором'],
        minuses: ['риск загрязнения', 'много жалоб'],
        description: item.inspectorComment || item.description,
      })),
      {
        id: 'risk-aktau',
        kind: 'risk',
        title: 'Актау, портовая зона',
        markerType: 'Зона риска',
        latitude: 43.6511,
        longitude: 51.1975,
        pluses: ['рядом населённый пункт', 'удобная логистика'],
        minuses: ['риск загрязнения', 'много жалоб'],
        description: 'Зона с высокой активностью и регулярными обращениями.',
      },
      {
        id: 'risk-telman',
        kind: 'risk',
        title: 'Тельман',
        markerType: 'Зона риска',
        latitude: 43.7167,
        longitude: 51.1167,
        pluses: ['много рыбы'],
        minuses: ['снижение количества рыбы', 'растущая нагрузка'],
        description: 'Район требует наблюдения из-за крупных уловов.',
      },
    ];
  }

  private ecoTypeLabel(type: string) {
    const labels: Record<string, string> = {
      pollution: 'Загрязнение',
      trash: 'Мусор',
      dead_fish: 'Мёртвая рыба',
      illegal_nets: 'Незаконные сети',
    };
    return labels[type] || 'Экологическая проблема';
  }
}
