import { AppDataSource } from "../config/data-source";
import { District } from "../entities/District";
import { CreateDistrictDTO } from "../dtos/masters/CreateDistrict.dto";
import { UpdateMasterDTO } from "../dtos/masters/UpdateMaster.dto";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
import { ValidationError } from "../errors/ValidationError";

export class DistrictService {

  //====================================================
  // CREATE
  //====================================================

  static async create(dto: CreateDistrictDTO) {
    const repo = AppDataSource.getRepository(District);

    //----------------------------------
    // Check duplicate name
    //----------------------------------

    const existing = await repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictError("District already exists");
    }

    //----------------------------------
    // Save
    //----------------------------------

    const entity = repo.create({
      name: dto.name,
      is_active: dto.is_active ?? true,
    });

    return repo.save(entity);
  }

  //====================================================
  // GET BY ID
  //====================================================

  static async getById(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(District);

    //----------------------------------
    // Load with related complexes
    //----------------------------------

    const entity = await repo.findOne({
      where: { id },
      relations: { complexes: true },
    });

    if (!entity) {
      throw new NotFoundError("District not found");
    }

    return entity;
  }

  //====================================================
  // LIST
  //====================================================

  static async list(filters: any) {
    const repo = AppDataSource.getRepository(District);
    const qb = repo.createQueryBuilder("d");

    //----------------------------------
    // Optional: include complexes
    //----------------------------------

    if (filters.include === "complexes") {
      qb.leftJoinAndSelect("d.complexes", "complexes");
    }

    //----------------------------------
    // Filters
    //----------------------------------

    if (filters.name) {
      qb.andWhere("LOWER(d.name) LIKE LOWER(:name)", {
        name: `%${filters.name}%`,
      });
    }

    if (filters.is_active !== undefined) {
      qb.andWhere("d.is_active = :active", {
        active: filters.is_active,
      });
    }

    //----------------------------------
    // Pagination
    //----------------------------------

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    qb.skip((page - 1) * limit);
    qb.take(limit);
    qb.orderBy("d.name", "ASC");

    return qb.getMany();
  }

  //====================================================
  // UPDATE
  //====================================================

  static async update(id: number, dto: UpdateMasterDTO) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(District);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError("District not found");
    }

    //----------------------------------
    // Check duplicate name if changing
    //----------------------------------

    if (dto.name && dto.name !== entity.name) {
      const dup = await repo.findOne({ where: { name: dto.name } });
      if (dup) {
        throw new ConflictError("District name already exists");
      }
    }

    Object.assign(entity, dto);
    return repo.save(entity);
  }

  //====================================================
  // DELETE
  //====================================================

  static async delete(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(District);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError("District not found");
    }

    await repo.remove(entity);
  }
}
