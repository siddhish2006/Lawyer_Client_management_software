import { CreateCaseDTO } from "../dtos/case/CreateCase.dto";
import { UpdateCaseDTO } from "../dtos/case/UpdateCase.dto";

/**
 * Case Validators
 *
 * These are NOT middleware.
 * They are schemas (DTOs) consumed by validation.middleware.ts
 *
 * Usage:
 * validateDto(CaseValidator.create)
 * validateDto(CaseValidator.update)
 */
export const CaseValidator = {
  create: CreateCaseDTO,
  update: UpdateCaseDTO,
};
