import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/ValidationError";

/**
 * validateDto
 *
 * Generic validation middleware.
 * Takes a DTO/Validator class and validates req.body against it.
 */
export const validateDto =
  (DtoClass: any) =>
  async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {

    //----------------------------------------
    // Transform plain request body to class
    //----------------------------------------

    const dtoObject = plainToInstance(
      DtoClass,
      req.body
    );

    //----------------------------------------
    // Run validation
    //----------------------------------------

    const errors = await validate(dtoObject, {
      whitelist: true,            // strip unknown fields
      forbidNonWhitelisted: true, // error on extra fields
    });

    //----------------------------------------
    // If validation errors exist
    //----------------------------------------

    if (errors.length > 0) {

      const messages = errors.flatMap(error =>
        Object.values(error.constraints || {})
      );

      throw new ValidationError(
        messages.join(", ")
      );
    }

    //----------------------------------------
    // Replace body with validated DTO
    //----------------------------------------

    req.body = dtoObject;

    next();
  };
