import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { validateEnvironment } from './config/env.validation';
import { createValidationPipe } from './common/validation/validation-pipe.factory';
import { ValidationExceptionFilter } from './common/validation/validation-exception.filter';
import { ValidationObservationService } from './common/validation/validation-observation.service';
import { observedRulesAreEnforced } from './common/validation/observe.decorator';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate environment variables before starting the application
  try {
    validateEnvironment();
  } catch (error) {
    logger.error('Environment validation failed:');
    logger.error(error.message);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers. CORP is relaxed so the SPA (different origin in dev/UAT)
  // can load images served from /uploads/.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // API-only server; SPA is served separately
    }),
  );

  // Global validation pipe — configuration lives in createValidationPipe() so
  // the bootstrap and the e2e test apps cannot drift apart.
  app.useGlobalPipes(createValidationPipe(app.get(ValidationObservationService)));

  // Reshapes validation 400s into field-addressable errors and logs them.
  app.useGlobalFilters(new ValidationExceptionFilter());

  if (!observedRulesAreEnforced()) {
    logger.warn(
      'VALIDATION_ENFORCE_OBSERVED is not true — rules marked @Observe are ' +
        'recorded but NOT rejected. Review GET /validation/observations before ' +
        'enabling. All other validation rules are enforced as normal.',
    );
  }

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

  logger.log(`Backend running on port ${port}`);
  logger.log(`CORS enabled for ${corsOrigin}`);
  logger.log(`Static files served from /uploads/ (${uploadsDir})`);
}

bootstrap();
