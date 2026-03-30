import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * CreateClientTypeDTO
 *
 * Validates data for creating a new client type.
 */
export class CreateClientTypeDTO {

  //----------------------------------
  // Master Fields
  //----------------------------------

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
