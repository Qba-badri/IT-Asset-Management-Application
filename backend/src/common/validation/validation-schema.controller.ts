import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ValidationSchemaService } from './validation-schema.service';
import { FormSchema } from './validation-schema.types';

/**
 * Serves the reflected DTO rules to the client.
 *
 * Authenticated but not permission-gated: a schema describes the shape of a
 * form, not any business data, and rules are identical for every user by
 * design (see the design doc — rules are not role-configurable).
 */
@Controller('schema')
@UseGuards(AuthGuard('jwt'))
export class ValidationSchemaController {
  constructor(private readonly schemaService: ValidationSchemaService) {}

  @Get()
  listForms(): { formKeys: string[] } {
    return { formKeys: this.schemaService.getFormKeys() };
  }

  @Get(':formKey')
  getSchema(@Param('formKey') formKey: string): FormSchema {
    return this.schemaService.getSchema(formKey);
  }
}
