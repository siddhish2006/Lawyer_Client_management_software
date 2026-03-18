import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";
import { Defendant } from "./Defendant";

@Entity("case_defendants")
export class CaseDefendant {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, c => c.defendants)
  @JoinColumn({ name: "case_id" })
  case!: Case;

  @ManyToOne(() => Defendant, d => d.case_links)
  @JoinColumn({ name: "defendant_id" })
  defendant!: Defendant;
}
