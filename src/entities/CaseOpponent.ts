import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Case } from "./Case";
import { Opponent } from "./Opponent";

@Entity("case_opponents")
export class CaseOpponent {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, c => c.opponents)
  case!: Case;

  @ManyToOne(() => Opponent, o => o.case_links)
  opponent!: Opponent;
}
