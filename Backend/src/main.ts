import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || origin.startsWith('http://localhost:')) {
        callback(null, true);
        return;
      }

      callback(null, frontendUrl.split(',').map((url) => url.trim()).includes(origin));
    },
    credentials: true,
  });

  await app.listen(Number(process.env.PORT) || 3000);
}

void bootstrap();
