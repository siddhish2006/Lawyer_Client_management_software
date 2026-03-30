import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * CreateCaseCategoryDTO
 *
 * Validates data for creating a new case category.
 */
export class CreateCaseCategoryDTO {

  //----------------------------------
  // Master Fields
  //----------------------------------

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
