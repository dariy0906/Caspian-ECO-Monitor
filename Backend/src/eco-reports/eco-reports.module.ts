import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { EcoReport } from './entities/eco-report.entity';
import { EcoReportsController } from './eco-reports.controller';
import { EcoReportsService } from './eco-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([EcoReport, User])],
  controllers: [EcoReportsController],
  providers: [EcoReportsService],
})
export class EcoReportsModule {}
