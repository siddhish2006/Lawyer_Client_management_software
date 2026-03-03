import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Case } from "./Case";
import { Defendant } from "./Defendant";

@Entity("case_defendants")
export class CaseDefendant {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, c => c.defendants)
  case!: Case;

  @ManyToOne(() => Defendant, d => d.case_links)
  defendant!: Defendant;
}
