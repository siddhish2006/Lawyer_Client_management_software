import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * CreateDistrictDTO
 *
 * Validates data for creating a new district.
 */
export class CreateDistrictDTO {

  //----------------------------------
  // Master Fields
  //----------------------------------

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
