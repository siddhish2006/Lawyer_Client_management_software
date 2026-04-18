import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Case } from "./Case";
import { Opponent } from "./Opponent";

@Entity("case_opponents")
@Unique("uq_case_opponents_case_opponent", ["case", "opponent"])
export class CaseOpponent {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, c => c.opponents)
  @JoinColumn({ name: "case_id" })
  case!: Case;

  @ManyToOne(() => Opponent, o => o.case_links)
  @JoinColumn({ name: "opponent_id" })
  opponent!: Opponent;
}
