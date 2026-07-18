import { IsBoolean } from 'class-validator';

/** Body of the PATCH .../:id/status endpoints. */
export class UpdateStatusDto {
  @IsBoolean()
  isActive: boolean;
}
