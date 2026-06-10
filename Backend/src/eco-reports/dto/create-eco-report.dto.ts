import { EcoReportType } from '../entities/eco-report.entity';

export class CreateEcoReportDto {
  userId: number;
  type: EcoReportType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
}
