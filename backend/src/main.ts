import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  // Validate environment variables before starting the application
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Create uploads directory if it doesn't exist
  const uploadsPath = process.env.UPLOAD_PATH || './uploads';
  const uploadsDir = join(process.cwd(), uploadsPath, 'assets');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), uploadsPath), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ Backend running on http://localhost:${port}`);
    console.log(`✅ CORS enabled for ${corsOrigin}`);
    console.log(`✅ Static files served from /uploads/`);
    console.log(`✅ Uploads directory: ${uploadsDir}`);
  }
}

bootstrap();
