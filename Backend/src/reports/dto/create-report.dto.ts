import { ReportType } from '../entities/report.entity';

export class CreateReportDto {
  type: ReportType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}
