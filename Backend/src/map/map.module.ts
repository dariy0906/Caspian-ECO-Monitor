import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Catch } from '../catches/entities/catch.entity';
import { EcoReport } from '../eco-reports/entities/eco-report.entity';
import { MapController } from './map.controller';
import { MapService } from './map.service';

@Module({
  imports: [TypeOrmModule.forFeature([Catch, EcoReport])],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
