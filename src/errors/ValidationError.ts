import { AppError } from "./AppError";

/**
 * Used when user input is invalid.
 */
export class ValidationError extends AppError {

  constructor(message: string = "Invalid request data") {
    super(message, 400);
  }

}
