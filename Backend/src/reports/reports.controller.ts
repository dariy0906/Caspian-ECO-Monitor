import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.reportsService.getStats();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateReportStatusDto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(+id, updateReportStatusDto.status);
  }
}
