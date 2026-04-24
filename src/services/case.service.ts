import { AppDataSource } from "../config/data-source";
import { CreateCaseDTO } from "../dtos/case/CreateCase.dto";
import { UpdateCaseDTO } from "../dtos/case/UpdateCase.dto";
import { Case } from "../entities/Case";
import { CaseClient } from "../entities/CaseClient";
import { CaseDefendant } from "../entities/CaseDefendant";
import { CaseOpponent } from "../entities/CaseOpponent";
import { Client } from "../entities/Client";
import { Defendant } from "../entities/Defendant";
import { Opponent } from "../entities/Opponent";
import { Hearing } from "../entities/Hearing";
import { NotFoundError } from "../errors/NotFoundError";
import { ValidationError } from "../errors/ValidationError";

//---------------------------------------------------------------
// Flatten join-table rows so the API returns Client/Defendant/Opponent
// arrays directly on the case (not the link rows).
//---------------------------------------------------------------
function flattenCase(c: Case): any {
  return {
    ...c,
    clients: (c.clients || []).map((cc: any) => cc.client).filter(Boolean),
    defendants: (c.defendants || []).map((cd: any) => cd.defendant).filter(Boolean),
    opponents: (c.opponents || []).map((co: any) => co.opponent).filter(Boolean),
  };
}

export class CaseService {

  //====================================================
  // CREATE CASE
  //====================================================

  static async createCase(dto: CreateCaseDTO) {

    return await AppDataSource.transaction(async (manager) => {

      const caseRepo = manager.getRepository(Case);
      const clientRepo = manager.getRepository(Client);
      const defendantRepo = manager.getRepository(Defendant);
      const opponentRepo = manager.getRepository(Opponent);

      //----------------------------------
      // Validate Clients
      //----------------------------------

      const uniqueClientIds = Array.from(new Set(dto.client_ids));
      const clients = await clientRepo.findByIds(uniqueClientIds);

      if (clients.length !== uniqueClientIds.length) {
        throw new ValidationError("One or more clients not found");
      }

      //----------------------------------
      // Validate Defendants (optional)
      //----------------------------------

      let defendants: Defendant[] = [];

      if (dto.defendant_ids?.length) {
        const uniqueDefendantIds = Array.from(new Set(dto.defendant_ids));
        defendants = await defendantRepo.findByIds(uniqueDefendantIds);

        if (defendants.length !== uniqueDefendantIds.length) {
          throw new ValidationError("One or more defendants not found");
        }
      }

      //----------------------------------
      // Validate Opponents (optional)
      //----------------------------------

      let opponents: Opponent[] = [];

      if (dto.opponent_ids?.length) {
        const uniqueOpponentIds = Array.from(new Set(dto.opponent_ids));
        opponents = await opponentRepo.findByIds(uniqueOpponentIds);

        if (opponents.length !== uniqueOpponentIds.length) {
          throw new ValidationError("One or more opponents not found");
        }
      }

      //----------------------------------
      // Create Case Entity
      //----------------------------------

      const caseEntity = caseRepo.create({
        case_number: dto.case_number,
        title: dto.title,
        act: dto.act,
        registration_date: dto.registration_date,
        description: dto.description,
        notes: dto.notes,
        case_category: { id: dto.case_category_id } as any,
        case_type: { id: dto.case_type_id } as any,
        case_status: { id: dto.case_status_id } as any,
        district: { id: dto.district_id } as any,
        court_complex: { id: dto.court_complex_id } as any,
        court_name: { id: dto.court_name_id } as any,
      });

      const savedCase = await caseRepo.save(caseEntity);

      //----------------------------------
      // Link Clients
      //----------------------------------

      for (const client of clients) {
        const link = manager.getRepository(CaseClient).create({
          case: savedCase,
          client,
        });
        await manager.save(link);
      }

      //----------------------------------
      // Link Defendants
      //----------------------------------

      for (const defendant of defendants) {
        const link = manager.getRepository(CaseDefendant).create({
          case: savedCase,
          defendant,
        });
        await manager.save(link);
      }

      //----------------------------------
      // Link Opponents
      //----------------------------------

      for (const opponent of opponents) {
        const link = manager.getRepository(CaseOpponent).create({
          case: savedCase,
          opponent,
        });
        await manager.save(link);
      }

      return savedCase;
    });
  }

  //====================================================
  // GET CASE BY ID
  //====================================================

  static async getCaseById(id: number) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid case ID required");
    }

    const caseRepo = AppDataSource.getRepository(Case);

    const caseEntity = await caseRepo.findOne({
      where: { case_id: id },
      relations: {
        clients: { client: true },
        defendants: { defendant: true },
        opponents: { opponent: true },
        hearings: true,
        case_category: true,
        case_type: true,
        case_status: true,
        district: true,
        court_complex: true,
        court_name: true,
      }
    });

    if (!caseEntity) {
      throw new NotFoundError("Case not found");
    }

    return flattenCase(caseEntity);
  }

  //====================================================
  // LIST CASES WITH FILTERING
  //====================================================

  static async listCases(filters: any) {

    const caseRepo = AppDataSource.getRepository(Case);

    const qb = caseRepo.createQueryBuilder("c")
      .leftJoinAndSelect("c.clients", "case_clients")
      .leftJoinAndSelect("case_clients.client", "client")
      .leftJoinAndSelect("c.defendants", "case_defendants")
      .leftJoinAndSelect("case_defendants.defendant", "defendant")
      .leftJoinAndSelect("c.opponents", "case_opponents")
      .leftJoinAndSelect("case_opponents.opponent", "opponent")
      .leftJoinAndSelect("c.case_category", "case_category")
      .leftJoinAndSelect("c.case_type", "case_type")
      .leftJoinAndSelect("c.case_status", "case_status")
      .leftJoinAndSelect("c.district", "district")
      .leftJoinAndSelect("c.court_complex", "court_complex")
      .leftJoinAndSelect("c.court_name", "court_name");

    //----------------------------------
    // Filtering
    //----------------------------------

    if (filters.case_number) {
      qb.andWhere("LOWER(c.case_number) LIKE LOWER(:num)", {
        num: `%${filters.case_number}%`
      });
    }

    if (filters.status_id) {
      qb.andWhere("c.case_status_id = :status", {
        status: filters.status_id
      });
    }

    //----------------------------------
    // Filter by client (used by client-detail view)
    //----------------------------------

    if (filters.client_id) {
      qb.andWhere(
        "c.case_id IN (SELECT cc.case_id FROM case_clients cc WHERE cc.client_id = :cid)",
        { cid: Number(filters.client_id) }
      );
    }

    if (filters.category_id) {
      qb.andWhere("case_category.id = :catId", { catId: Number(filters.category_id) });
    }

    if (filters.type_id) {
      qb.andWhere("case_type.id = :typeId", { typeId: Number(filters.type_id) });
    }

    if (filters.district_id) {
      qb.andWhere("district.id = :distId", { distId: Number(filters.district_id) });
    }

    if (filters.court_complex_id) {
      qb.andWhere("court_complex.id = :ccId", { ccId: Number(filters.court_complex_id) });
    }

    if (filters.court_name_id) {
      qb.andWhere("court_name.id = :cnId", { cnId: Number(filters.court_name_id) });
    }

    //----------------------------------
    // Pagination (only applied when caller passes page/limit; searches want
    // the full set so they can match across every field client-side)
    //----------------------------------

    if (filters.page !== undefined || filters.limit !== undefined) {
      const page = Math.max(Number(filters.page) || 1, 1);
      const limit = Math.max(Number(filters.limit) || 20, 1);
      qb.skip((page - 1) * limit);
      qb.take(limit);
    }

    qb.orderBy("c.created_on", "DESC");

    const cases = await qb.getMany();
    return cases.map(flattenCase);
  }

  //====================================================
  // UPDATE CASE
  //====================================================

  static async updateCase(id: number, dto: UpdateCaseDTO) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid case ID required");
    }

    return await AppDataSource.transaction(async (manager) => {

      const caseRepo = manager.getRepository(Case);

      const caseEntity = await caseRepo.findOne({
        where: { case_id: id }
      });

      if (!caseEntity) {
        throw new NotFoundError("Case not found");
      }

      //----------------------------------
      // Update scalar / FK fields (skip relation arrays)
      //----------------------------------

      const { client_ids, defendant_ids, opponent_ids, ...scalar } = dto as any;

      // Map FK ids to relation objects so TypeORM updates them correctly
      const fkMap: Record<string, string> = {
        case_category_id: "case_category",
        case_type_id: "case_type",
        case_status_id: "case_status",
        district_id: "district",
        court_complex_id: "court_complex",
        court_name_id: "court_name",
      };

      for (const [idKey, relKey] of Object.entries(fkMap)) {
        if (scalar[idKey] !== undefined) {
          (caseEntity as any)[relKey] = { id: scalar[idKey] };
          delete scalar[idKey];
        }
      }

      Object.assign(caseEntity, scalar);
      caseEntity.last_updated = new Date();

      await caseRepo.save(caseEntity);

      //----------------------------------
      // Replace client links if provided
      //----------------------------------

      if (client_ids) {
        await manager.delete(CaseClient, { case: { case_id: id } });
        for (const clientId of Array.from(new Set<number>(client_ids))) {
          const link = manager.getRepository(CaseClient).create({
            case: caseEntity,
            client: { client_id: clientId } as any,
          });
          await manager.save(link);
        }
      }

      //----------------------------------
      // Replace defendant links if provided
      //----------------------------------

      if (defendant_ids) {
        await manager.delete(CaseDefendant, { case: { case_id: id } });
        for (const defendantId of Array.from(new Set<number>(defendant_ids))) {
          const link = manager.getRepository(CaseDefendant).create({
            case: caseEntity,
            defendant: { defendant_id: defendantId } as any,
          });
          await manager.save(link);
        }
      }

      //----------------------------------
      // Replace opponent links if provided
      //----------------------------------

      if (opponent_ids) {
        await manager.delete(CaseOpponent, { case: { case_id: id } });
        for (const opponentId of Array.from(new Set<number>(opponent_ids))) {
          const link = manager.getRepository(CaseOpponent).create({
            case: caseEntity,
            opponent: { opponent_id: opponentId } as any,
          });
          await manager.save(link);
        }
      }

      return caseEntity;
    });
  }

  //====================================================
  // DELETE CASE (SOFT DELETE LATER)
  //====================================================

  static async deleteCase(id: number) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid case ID required");
    }

    return await AppDataSource.transaction(async (manager) => {

      const caseRepo = manager.getRepository(Case);

      const caseEntity = await caseRepo.findOne({
        where: { case_id: id }
      });

      if (!caseEntity) {
        throw new NotFoundError("Case not found");
      }

      //----------------------------------
      // Delete dependents first to avoid FK violations
      // (no ON DELETE CASCADE on these FKs)
      //----------------------------------

      await manager.delete(CaseClient, { case: { case_id: id } });
      await manager.delete(CaseDefendant, { case: { case_id: id } });
      await manager.delete(CaseOpponent, { case: { case_id: id } });
      // Reminders and hearing logs cascade-delete from hearings
      await manager.delete(Hearing, { case: { case_id: id } });

      await caseRepo.remove(caseEntity);
    });
  }
}
