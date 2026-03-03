import { AppError } from "./AppError";

/**
 * Used when a resource already exists.
 */
export class ConflictError extends AppError {

  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }

}
