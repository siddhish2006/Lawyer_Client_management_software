import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * CreateCaseStatusDTO
 *
 * Validates data for creating a new case status.
 */
export class CreateCaseStatusDTO {

  //----------------------------------
  // Master Fields
  //----------------------------------

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
