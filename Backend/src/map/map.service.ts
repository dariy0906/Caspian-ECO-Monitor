import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { EcoReport } from '../eco-reports/entities/eco-report.entity';
import { MapMarkerNote } from './map-marker-note.entity';

type MapNoteAction = 'add_plus' | 'add_minus' | 'remove_plus' | 'remove_minus';
type RawMapMarker = {
  id: string;
  kind: 'catch' | 'eco' | 'risk';
  title: string;
  markerType: string;
  latitude: number;
  longitude: number;
  pluses: string[];
  minuses: string[];
  description: string;
  totalWeight?: number;
  catchCount?: number;
  fishStats?: Record<string, number>;
  loadLevel?: 'low' | 'medium' | 'high';
  updatedAt?: Date;
};

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Catch)
    private readonly catchesRepository: Repository<Catch>,
    @InjectRepository(EcoReport)
    private readonly ecoReportsRepository: Repository<EcoReport>,
    @InjectRepository(MapMarkerNote)
    private readonly markerNotesRepository: Repository<MapMarkerNote>,
  ) {}

  async getMarkers() {
    const catches = await this.catchesRepository.find({
      where: { verificationStatus: 'approved' },
    });
    const reports = await this.ecoReportsRepository.find({
      where: { status: 'approved' },
    });

    const catchMarkers = Object.values(
      catches.reduce<Record<string, RawMapMarker & {
        totalWeight: number;
        catchCount: number;
        fishStats: Record<string, number>;
        loadLevel: 'low' | 'medium' | 'high';
      }>>((acc, item) => {
        const key = item.locationName;
        const weight = Number(item.weight);
        acc[key] = acc[key] || {
          id: `catch-area-${key}`,
          kind: 'catch',
          title: item.locationName,
          markerType: 'Рыболовная точка',
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          pluses: ['много рыбы', 'удобный берег', 'рядом населённый пункт'],
          minuses: ['требуется регулярный мониторинг'],
          description: 'Подтверждённая инспектором рыболовная активность.',
          totalWeight: 0,
          catchCount: 0,
          fishStats: {},
          loadLevel: 'low',
        };
        acc[key].totalWeight += weight;
        acc[key].catchCount += 1;
        acc[key].fishStats[item.fishType] = (acc[key].fishStats[item.fishType] || 0) + weight;
        acc[key].loadLevel = this.getLoadLevel(acc[key].totalWeight);
        acc[key].minuses =
          acc[key].totalWeight > 300
            ? ['высокая нагрузка', 'снижение количества рыбы']
            : acc[key].totalWeight >= 100
              ? ['растущая нагрузка', 'нужен контроль вылова']
              : ['требуется регулярный мониторинг'];
        return acc;
      }, {}),
    );

    const ecoMarkers: RawMapMarker[] = reports.map((item) => ({
      id: `eco-${item.id}`,
      kind: 'eco',
      title: item.locationName,
      markerType: this.ecoTypeLabel(item.type),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      pluses: ['есть сигнал от жителей', 'точка проверена инспектором'],
      minuses: this.ecoMinuses(item),
      description: item.inspectorComment || item.description,
      updatedAt: item.approvedAt || item.createdAt,
    }));
    const riskMarkers: RawMapMarker[] = [
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

    const markers: RawMapMarker[] = [
      ...catchMarkers,
      ...ecoMarkers,
      ...riskMarkers,
    ];

    return this.applyMarkerNotes(markers);
  }

  async updateMarkerNotes(markerId: string, action: MapNoteAction, text: string) {
    const normalizedText = text.trim();
    let note = await this.markerNotesRepository.findOneBy({ markerId });

    if (!note) {
      note = this.markerNotesRepository.create({
        markerId,
        pluses: [],
        minuses: [],
        hiddenPluses: [],
        hiddenMinuses: [],
      });
    }

    note.pluses = note.pluses || [];
    note.minuses = note.minuses || [];
    note.hiddenPluses = note.hiddenPluses || [];
    note.hiddenMinuses = note.hiddenMinuses || [];

    if (normalizedText) {
      if (action === 'add_plus') {
        note.pluses = this.addUnique(note.pluses, normalizedText);
        note.hiddenPluses = this.removeValue(note.hiddenPluses, normalizedText);
      }
      if (action === 'add_minus') {
        note.minuses = this.addUnique(note.minuses, normalizedText);
        note.hiddenMinuses = this.removeValue(note.hiddenMinuses, normalizedText);
      }
      if (action === 'remove_plus') {
        note.pluses = this.removeValue(note.pluses, normalizedText);
        note.hiddenPluses = this.addUnique(note.hiddenPluses, normalizedText);
      }
      if (action === 'remove_minus') {
        note.minuses = this.removeValue(note.minuses, normalizedText);
        note.hiddenMinuses = this.addUnique(note.hiddenMinuses, normalizedText);
      }
    }

    return this.markerNotesRepository.save(note);
  }

  private async applyMarkerNotes(markers: RawMapMarker[]) {
    const notes = await this.markerNotesRepository.find();
    const notesByMarker = notes.reduce<Record<string, MapMarkerNote>>((acc, item) => {
      acc[item.markerId] = item;
      return acc;
    }, {});

    return markers.map((marker) => {
      const note = notesByMarker[marker.id];
      if (!note) {
        return marker;
      }

      return {
        ...marker,
        pluses: this.mergeNotes(marker.pluses, note.pluses, note.hiddenPluses),
        minuses: this.mergeNotes(marker.minuses, note.minuses, note.hiddenMinuses),
        updatedAt: note.updatedAt || marker.updatedAt,
      };
    });
  }

  private mergeNotes(base: string[], custom: string[] | null, hidden: string[] | null) {
    const hiddenSet = new Set(hidden || []);
    return this.unique([...base.filter((item) => !hiddenSet.has(item)), ...(custom || [])]);
  }

  private unique(items: string[]) {
    return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
  }

  private addUnique(items: string[], value: string) {
    return this.unique([...items, value]);
  }

  private removeValue(items: string[], value: string) {
    return items.filter((item) => item !== value);
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

  private ecoMinuses(report: EcoReport) {
    const minusesByType: Record<string, string[]> = {
      pollution: ['риск загрязнения воды', 'опасность для рыбы', 'нужна проверка проб'],
      trash: ['мусор на берегу', 'риск попадания пластика в море', 'ухудшение береговой зоны'],
      dead_fish: ['сигнал о возможной проблеме воды', 'риск заболевания рыбы', 'нужна срочная проверка'],
      illegal_nets: ['угроза молоди рыбы', 'незаконный вылов', 'снижение популяции'],
    };
    const base = minusesByType[report.type] || ['риск для экосистемы', 'нужен мониторинг'];
    return report.inspectorComment ? [...base, report.inspectorComment] : base;
  }

  private getLoadLevel(weight: number) {
    if (weight < 100) {
      return 'low' as const;
    }
    if (weight <= 300) {
      return 'medium' as const;
    }
    return 'high' as const;
  }
}
