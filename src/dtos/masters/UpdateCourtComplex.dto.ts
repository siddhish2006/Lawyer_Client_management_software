import { IsString, IsOptional, IsBoolean, IsNumber } from "class-validator";

/**
 * UpdateCourtComplexDTO
 *
 * All fields optional for partial update.
 */
export class UpdateCourtComplexDTO {

  //----------------------------------
  // Master Fields
  //----------------------------------

  @IsOptional()
  @IsString()
  name?: string;

  //----------------------------------
  // Foreign Key
  //----------------------------------

  @IsOptional()
  @IsNumber()
  district_id?: number;

  //----------------------------------
  // Optional
  //----------------------------------

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
