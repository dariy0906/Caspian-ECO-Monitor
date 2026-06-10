import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateEcoReportDto } from './dto/create-eco-report.dto';
import { ReviewEcoReportDto } from './dto/review-eco-report.dto';
import { EcoReportsService } from './eco-reports.service';

@Controller('eco-reports')
export class EcoReportsController {
  constructor(private readonly ecoReportsService: EcoReportsService) {}

  @Get()
  findAll() {
    return this.ecoReportsService.findAll();
  }

  @Get('pending')
  findPending() {
    return this.ecoReportsService.findPending();
  }

  @Get('approved')
  findApproved() {
    return this.ecoReportsService.findApproved();
  }

  @Post()
  create(@Body() dto: CreateEcoReportDto) {
    return this.ecoReportsService.create(dto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ReviewEcoReportDto) {
    return this.ecoReportsService.approve(+id, dto.inspectorComment);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: ReviewEcoReportDto) {
    return this.ecoReportsService.reject(+id, dto.inspectorComment);
  }
}
