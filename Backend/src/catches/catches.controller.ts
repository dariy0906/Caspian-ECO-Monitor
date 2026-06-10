import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CatchesService } from './catches.service';
import { CreateCatchDto } from './dto/create-catch.dto';
import { ReviewCatchDto } from './dto/review-catch.dto';

@Controller('catches')
export class CatchesController {
  constructor(private readonly catchesService: CatchesService) {}

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.catchesService.findAll(userId ? +userId : undefined);
  }

  @Get('approved')
  findApproved() {
    return this.catchesService.findApproved();
  }

  @Get('pending')
  findPending() {
    return this.catchesService.findPending();
  }

  @Post()
  create(@Body() dto: CreateCatchDto) {
    return this.catchesService.create(dto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ReviewCatchDto) {
    return this.catchesService.approve(+id, dto.inspectorComment);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: ReviewCatchDto) {
    return this.catchesService.reject(+id, dto.inspectorComment);
  }
}
