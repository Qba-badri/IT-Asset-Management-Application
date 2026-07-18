import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationSchemaController } from './validation-schema.controller';
import { ValidationSchemaService } from './validation-schema.service';
import { ValidationObservationService } from './validation-observation.service';
import { ValidationObservationController } from './validation-observation.controller';
import { ValidationObservation } from '../../entities/validation-observation.entity';
import { RequestContextMiddleware } from './request-context';

@Module({
  imports: [TypeOrmModule.forFeature([ValidationObservation])],
  controllers: [ValidationSchemaController, ValidationObservationController],
  providers: [ValidationSchemaService, ValidationObservationService],
  exports: [ValidationSchemaService, ValidationObservationService],
})
export class ValidationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Every route: an observed failure can occur on any endpoint with a DTO.
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
