import { CreateHearingDTO } from "../dtos/hearing/CreateHearing.dto";
import { UpdateHearingDTO } from "../dtos/hearing/UpdateHearing.dto";

/**
 * Hearing Validators
 *
 * These are used by validateDto middleware.
 * No logic here, only schema mapping.
 */

export const CreateHearingValidator = CreateHearingDTO;
export const UpdateHearingValidator = UpdateHearingDTO;
