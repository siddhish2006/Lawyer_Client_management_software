export interface FiltersDTO {
  name?: string;
  phone?: string;
  relationship?: string;
  client_type_id?: number | string;
  has_contact?: boolean | string;
  page?: number | string;
  limit?: number | string;
}
