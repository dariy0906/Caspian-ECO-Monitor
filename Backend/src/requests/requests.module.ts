import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerRequest } from './entities/buyer-request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerRequest])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
