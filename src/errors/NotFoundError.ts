import { AppError } from "./AppError";

/**
 * Used when a resource does not exist.
 * Example:
 * Client not found
 * Case not found
 */
export class NotFoundError extends AppError {

  constructor(message: string = "Resource not found") {
    super(message, 404);
  }

}
