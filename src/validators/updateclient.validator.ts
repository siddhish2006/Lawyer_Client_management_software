import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  Length,
  Matches
} from "class-validator";

import { Type } from "class-transformer";
import { ClientRelationship } from "../entities/Client";

/**
 * UpdateClientValidator
 *
 * RULE:
 * Every field is optional,
 * but MUST be valid if provided.
 */
export class UpdateClientValidator {

  //---------------------------------------
  // Full Name
  //---------------------------------------

  @IsOptional()
  @IsString()
  @Length(2, 120)
  full_name?: string;

  //---------------------------------------
  // Phone Number (Digits only)
  //---------------------------------------

  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, {
    message: "Phone number must contain only digits (10-15)"
  })
  phone_number?: string;

  //---------------------------------------
  // WhatsApp Number
  //---------------------------------------

  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, {
    message: "WhatsApp number must contain only digits (10-15)"
  })
  whatsapp_number?: string;

  //---------------------------------------
  // Email
  //---------------------------------------

  @IsOptional()
  @IsEmail()
  email?: string;

  //---------------------------------------
  // Address
  //---------------------------------------

  @IsOptional()
  @IsString()
  @Length(5, 255)
  address?: string;

  //---------------------------------------
  // Client Type FK
  //---------------------------------------

  @IsOptional()
  @Type(() => Number) // Converts string → number automatically
  @IsNumber()
  client_type_id?: number;

  //---------------------------------------
  // Date
  //---------------------------------------

  @IsOptional()
  date_of_association?: Date;

  //---------------------------------------
  // Practice Area
  //---------------------------------------

  @IsOptional()
  @IsString()
  @Length(2, 120)
  primary_practice_area?: string;

  //---------------------------------------
  // Relationship ENUM
  //---------------------------------------

  @IsOptional()
  @IsEnum(ClientRelationship)
  current_legal_relationship?: ClientRelationship;

  //---------------------------------------
  // Referral
  //---------------------------------------

  @IsOptional()
  @IsString()
  @Length(2, 120)
  referred_by?: string;
}
