import { AppDataSource } from "../config/data-source";
import { CourtComplex } from "../entities/CourtComplex";
import { District } from "../entities/District";
import { CreateCourtComplexDTO } from "../dtos/masters/CreateCourtComplex.dto";
import { UpdateCourtComplexDTO } from "../dtos/masters/UpdateCourtComplex.dto";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
import { ValidationError } from "../errors/ValidationError";

export class CourtComplexService {

  //====================================================
  // CREATE
  //====================================================

  static async create(dto: CreateCourtComplexDTO) {
    const repo = AppDataSource.getRepository(CourtComplex);

    //----------------------------------
    // Check duplicate name
    //----------------------------------

    const existing = await repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictError("Court complex already exists");
    }

    //----------------------------------
    // Validate district FK
    //----------------------------------

    const district = await AppDataSource.getRepository(District).findOne({
      where: { id: dto.district_id },
    });

    if (!district) {
      throw new NotFoundError("District not found");
    }

    //----------------------------------
    // Save
    //----------------------------------

    const entity = repo.create({
      name: dto.name,
      district,
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

    const repo = AppDataSource.getRepository(CourtComplex);

    //----------------------------------
    // Load with relations
    //----------------------------------

    const entity = await repo.findOne({
      where: { id },
      relations: { district: true, courts: true },
    });

    if (!entity) {
      throw new NotFoundError("Court complex not found");
    }

    return entity;
  }

  //====================================================
  // LIST
  //====================================================

  static async list(filters: any) {
    const repo = AppDataSource.getRepository(CourtComplex);
    const qb = repo.createQueryBuilder("cc")
      .leftJoinAndSelect("cc.district", "district");

    //----------------------------------
    // Filters
    //----------------------------------

    if (filters.name) {
      qb.andWhere("LOWER(cc.name) LIKE LOWER(:name)", {
        name: `%${filters.name}%`,
      });
    }

    if (filters.district_id) {
      qb.andWhere("district.id = :districtId", {
        districtId: Number(filters.district_id),
      });
    }

    if (filters.is_active !== undefined) {
      qb.andWhere("cc.is_active = :active", {
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
    qb.orderBy("cc.name", "ASC");

    return qb.getMany();
  }

  //====================================================
  // UPDATE
  //====================================================

  static async update(id: number, dto: UpdateCourtComplexDTO) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(CourtComplex);
    const entity = await repo.findOne({
      where: { id },
      relations: { district: true },
    });

    if (!entity) {
      throw new NotFoundError("Court complex not found");
    }

    //----------------------------------
    // Check duplicate name if changing
    //----------------------------------

    if (dto.name && dto.name !== entity.name) {
      const dup = await repo.findOne({ where: { name: dto.name } });
      if (dup) {
        throw new ConflictError("Court complex name already exists");
      }
    }

    //----------------------------------
    // Validate district FK if changing
    //----------------------------------

    if (dto.district_id) {
      const district = await AppDataSource.getRepository(District).findOne({
        where: { id: dto.district_id },
      });

      if (!district) {
        throw new NotFoundError("District not found");
      }

      entity.district = district;
    }

    //----------------------------------
    // Apply remaining fields
    //----------------------------------

    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.is_active !== undefined) entity.is_active = dto.is_active;

    return repo.save(entity);
  }

  //====================================================
  // DELETE
  //====================================================

  static async delete(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(CourtComplex);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError("Court complex not found");
    }

    await repo.remove(entity);
  }
}
