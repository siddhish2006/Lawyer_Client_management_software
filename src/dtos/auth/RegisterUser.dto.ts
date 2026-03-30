import { IsString, IsEmail, IsEnum, Length, Matches } from "class-validator";
import { UserRole } from "../../entities/User";

/**
 * RegisterUserDTO
 *
 * Validates data for user registration.
 */
export class RegisterUserDTO {

  //----------------------------------
  // Personal Info
  //----------------------------------

  @IsString()
  @Length(2, 120)
  full_name!: string;

  @IsEmail()
  email!: string;

  @Matches(/^[0-9]{10,15}$/, {
    message: "Phone number must contain only digits (10-15)",
  })
  phone_number!: string;

  //----------------------------------
  // Credentials
  //----------------------------------

  @IsString()
  @Length(6, 128)
  password!: string;

  //----------------------------------
  // Role
  //----------------------------------

  @IsEnum(UserRole)
  role!: UserRole;
}
