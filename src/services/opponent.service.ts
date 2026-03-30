import { AppDataSource } from "../config/data-source";
import { Opponent } from "../entities/Opponent";
import { CreateOpponentDTO } from "../dtos/parties/CreateOpponent.dto";
import { UpdateOpponentDTO } from "../dtos/parties/UpdateOpponent.dto";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";

export class OpponentService {
  private static getOpponentRepo() {
    return AppDataSource.getRepository(Opponent);
  }

  static async create(dto: CreateOpponentDTO): Promise<Opponent> {
    const opponentRepo = this.getOpponentRepo();

    const existing = await opponentRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictError("Opponent already exists");
    }

    const item = opponentRepo.create(dto);

    const saved = await opponentRepo.save(item);

    return saved;
  }

  static async getById(id: number): Promise<Opponent> {
    const opponentRepo = this.getOpponentRepo();

    const item = await opponentRepo.findOne({
      where: { opponent_id: id },
    });

    if (!item) {
      throw new NotFoundError(`Opponent not found`);
    }

    return item;
  }

  static async list(query?: any): Promise<Opponent[]> {
    const opponentRepo = this.getOpponentRepo();

    const items = await opponentRepo.find({
      order: { opponent_id: "ASC" },
    });

    return items;
  }

  static async update(id: number, dto: UpdateOpponentDTO): Promise<Opponent> {
    const opponentRepo = this.getOpponentRepo();
    const item = await this.getById(id);

    Object.assign(item, dto);

    const updated = await opponentRepo.save(item);

    return updated;
  }

  static async delete(id: number): Promise<void> {
    const opponentRepo = this.getOpponentRepo();
    await this.getById(id);
    await opponentRepo.delete(id);
  }
}
