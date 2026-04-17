import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  Length,
  Matches
} from "class-validator";

import { ClientRelationship } from "../entities/Client";

/**
 * This class validates incoming request bodies.
 * If invalid → request NEVER reaches your service.
 */
export class CreateClientValidator {

  @IsString()
  @Length(2, 120)
  full_name!: string;

  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, {
    message: "Phone number must contain only digits (10-15)"
  })
  phone_number?: string;

  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, {
    message: "WhatsApp number must contain only digits (10-15)"
  })
  whatsapp_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNumber()
  client_type_id!: number;

  @IsOptional()
  date_of_association?: Date;

  @IsOptional()
  @IsString()
  primary_practice_area?: string;

  @IsEnum(ClientRelationship)
  current_legal_relationship!: ClientRelationship;

  @IsOptional()
  @IsString()
  referred_by?: string;
}
