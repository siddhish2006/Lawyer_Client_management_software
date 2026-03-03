import { ClientRelationship } from "../../entities/Client";

/**
 * DTO = Data Transfer Object
 *
 * Defines EXACTLY what the API accepts.
 * Nothing more.
 * Nothing less.
 */
export interface CreateClientDTO {

  full_name: string;

  phone_number: string;

  whatsapp_number?: string;

  email?: string;

  address?: string;

  client_type_id: number;

  date_of_association?: Date;

  primary_practice_area?: string;

  current_legal_relationship: ClientRelationship;

  referred_by?: string;
}
