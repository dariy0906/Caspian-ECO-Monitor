import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CatchesModule } from './catches/catches.module';
import { EcoReportsModule } from './eco-reports/eco-reports.module';
import { MapModule } from './map/map.module';
import { MarketModule } from './market/market.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUser = config.get<string>('DB_USER')?.trim();
        const dbPassword = config.get<string>('DB_PASSWORD')?.trim();
        const username = dbUser === '__anonymous__' ? '' : (dbUser ?? 'root');
        const password = dbPassword === '__empty__' ? '' : (dbPassword ?? 'password');

        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: Number(config.get<string>('DB_PORT')) || 3306,
          username,
          password,
          database: config.get<string>('DB_NAME') ?? 'caspian_eco_monitor',
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNC') !== 'false',
        };
      },
    }),
    UsersModule,
    AuthModule,
    CatchesModule,
    EcoReportsModule,
    MarketModule,
    MapModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
