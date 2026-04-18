import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Case } from "./Case";
import { Defendant } from "./Defendant";

@Entity("case_defendants")
@Unique("uq_case_defendants_case_defendant", ["case", "defendant"])
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
