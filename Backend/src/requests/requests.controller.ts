import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { CreateBuyerRequestDto } from './dto/create-buyer-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBuyerRequestDto) {
    return this.requestsService.create(dto);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Body() dto: AcceptRequestDto) {
    return this.requestsService.accept(+id, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.requestsService.complete(+id);
  }
}
