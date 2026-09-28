import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

export function configureApp(app: INestApplication) {
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins?.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }

      callback(new Error('Origem nao permitida pelo CORS'));
    },
  });
}
