import { IsString, IsEmail } from "class-validator";

/**
 * LoginUserDTO
 *
 * Validates login credentials.
 */
export class LoginUserDTO {

  //----------------------------------
  // Credentials
  //----------------------------------

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
