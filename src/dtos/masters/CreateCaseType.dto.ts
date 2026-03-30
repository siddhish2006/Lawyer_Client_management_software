import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * CreateCaseTypeDTO
 *
 * Validates data for creating a new case type.
 */
export class CreateCaseTypeDTO {

  //----------------------------------
  // Master Fields
  //----------------------------------

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
