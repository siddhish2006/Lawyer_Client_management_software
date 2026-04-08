/**
 * Response mappers
 * ================
 * Transform TypeORM entities → frontend DTOs.
 *
 * Frontend contract lives in `cms/types/api.ts`. Keep in sync.
 *
 * Rules:
 * - Primary key is exposed as `id`
 * - Nested relations are flattened to *_id foreign keys + nested master refs
 * - Join-tables (case_clients, case_defendants, case_opponents) are unwrapped
 *   into flat arrays of their target entity
 * - null strings are coalesced to "" so frontend string ops don't crash
 */

import { Client } from "../entities/Client";
import { Case } from "../entities/Case";
import { Hearing } from "../entities/Hearing";
import { Defendant } from "../entities/Defendant";
import { Opponent } from "../entities/Opponent";

// ---------- primitives ----------
const s = (v: unknown): string => (v == null ? "" : String(v));
const iso = (v: unknown): string => {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
};

// ---------- master refs ----------
interface MasterLike {
  [k: string]: unknown;
  name?: string;
}
const masterPk = (rec: MasterLike | null | undefined): number | null => {
  if (!rec) return null;
  // master entities may use id or *_id as PK
  const candidates = [
    "id",
    "case_category_id",
    "case_type_id",
    "case_status_id",
    "client_type_id",
    "district_id",
    "court_complex_id",
    "court_name_id",
  ];
  for (const k of candidates) {
    const v = rec[k];
    if (typeof v === "number") return v;
  }
  return null;
};
const masterRef = (rec: MasterLike | null | undefined) => {
  if (!rec) return undefined;
  const id = masterPk(rec);
  if (id == null) return undefined;
  return { id, name: s(rec.name) };
};

// ---------- Client ----------
export function mapClient(c: Client | null | undefined): any {
  if (!c) return null;
  const ctId = masterPk(c.client_type as unknown as MasterLike);
  return {
    id: c.client_id,
    full_name: s(c.full_name),
    phone_number: s(c.phone_number),
    whatsapp_number: s(c.whatsapp_number),
    email: s(c.email),
    address: s(c.address),
    client_type_id: ctId ?? 0,
    client_type: masterRef(c.client_type as unknown as MasterLike),
    date_of_association: iso(c.date_of_association),
    primary_practice_area: s(c.primary_practice_area),
    current_legal_relationship: s(c.current_legal_relationship),
    referred_by: s(c.referred_by),
    created_at: iso(c.added_on),
    updated_at: iso(c.added_on),
  };
}

// ---------- Defendant ----------
export function mapDefendant(d: Defendant | null | undefined): any {
  if (!d) return null;
  return {
    id: d.defendant_id,
    name: s(d.name),
    phone_number: s(d.phone_number),
    email: s(d.email),
  };
}

// ---------- Opponent ----------
export function mapOpponent(o: Opponent | null | undefined): any {
  if (!o) return null;
  return {
    id: o.opponent_id,
    name: s(o.name),
    phone_number: s(o.phone_number),
    email: s(o.email),
  };
}

// ---------- Hearing ----------
export function mapHearing(h: Hearing | null | undefined): any {
  if (!h) return null;
  return {
    id: h.hearing_id,
    case_id: h.case?.case_id ?? 0,
    hearing_date: iso(h.hearing_date),
    purpose: s(h.purpose),
    requirements: s(h.requirements),
    notification_channels: [],
    created_at: iso(h.created_on),
    updated_at: iso(h.created_on),
  };
}

// ---------- Case ----------
export function mapCase(c: Case | null | undefined): any {
  if (!c) return null;

  // case.clients is CaseClient[], unwrap to Client[]
  const clientsFlat = (c.clients ?? [])
    .map((cc: any) => cc?.client)
    .filter(Boolean)
    .map(mapClient);

  const defendantsFlat = (c.defendants ?? [])
    .map((cd: any) => cd?.defendant)
    .filter(Boolean)
    .map(mapDefendant);

  const opponentsFlat = (c.opponents ?? [])
    .map((co: any) => co?.opponent)
    .filter(Boolean)
    .map(mapOpponent);

  return {
    id: c.case_id,
    case_number: s(c.case_number),
    act: s(c.act),
    registration_date: iso(c.registration_date),
    case_category_id: masterPk(c.case_category as unknown as MasterLike) ?? 0,
    case_type_id: masterPk(c.case_type as unknown as MasterLike) ?? 0,
    case_status_id: masterPk(c.case_status as unknown as MasterLike) ?? 0,
    district_id: masterPk(c.district as unknown as MasterLike) ?? 0,
    court_complex_id: masterPk(c.court_complex as unknown as MasterLike) ?? 0,
    court_name_id: masterPk(c.court_name as unknown as MasterLike) ?? 0,
    description: s(c.description),
    notes: s(c.notes),
    clients: clientsFlat,
    defendants: defendantsFlat,
    opponents: opponentsFlat,
    case_category: masterRef(c.case_category as unknown as MasterLike),
    case_type: masterRef(c.case_type as unknown as MasterLike),
    case_status: masterRef(c.case_status as unknown as MasterLike),
    district: masterRef(c.district as unknown as MasterLike),
    court_complex: masterRef(c.court_complex as unknown as MasterLike),
    court_name: masterRef(c.court_name as unknown as MasterLike),
    hearings: (c.hearings ?? []).map((h) => {
      // embed case-id shortcut without loading nested case
      const mapped = mapHearing(h);
      if (mapped && !mapped.case_id) mapped.case_id = c.case_id;
      return mapped;
    }),
    created_at: iso(c.created_on),
    updated_at: iso(c.last_updated),
  };
}
