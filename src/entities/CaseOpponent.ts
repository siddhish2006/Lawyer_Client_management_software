import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";
import { Opponent } from "./Opponent";

@Entity("case_opponents")
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
