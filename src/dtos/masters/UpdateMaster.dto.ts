import { IsString, IsOptional, IsBoolean } from "class-validator";

/**
 * UpdateMasterDTO
 *
 * Generic update DTO shared by simple master tables:
 * CaseCategory, CaseStatus, CaseType, ClientType, District
 */
export class UpdateMasterDTO {

  //----------------------------------
  // Master Fields (all optional)
  //----------------------------------

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
