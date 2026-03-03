import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { CaseCategory } from "./CaseCategory";
import { CaseType } from "./CaseType";
import { CaseStatus } from "./CaseStatus";
import { District } from "./District";
import { CourtComplex } from "./CourtComplex";
import { CourtName } from "./CourtName";
import { CaseClient } from "./CaseClient";
import { Hearing } from "./Hearing";
import { HearingLog } from "./HearingLog";
import { CaseOpponent } from "./CaseOpponent";
import { CaseDefendant } from "./CaseDefendant";

@Entity("cases")
export class Case {
  @PrimaryGeneratedColumn()
  case_id!: number;

  @Column()
  case_number!: string;

  @Column({ nullable: true })
  act!: string;

  @Column({ type: "date", nullable: true })
  registration_date!: Date;

  @ManyToOne(() => CaseCategory, c => c.cases)
  case_category!: CaseCategory;

  @ManyToOne(() => CaseType, c => c.cases)
  case_type!: CaseType;

  @ManyToOne(() => CaseStatus, c => c.cases)
  case_status!: CaseStatus;

  @ManyToOne(() => District, d => d.cases)
  district!: District;

  @ManyToOne(() => CourtComplex, c => c.cases)
  court_complex!: CourtComplex;

  @ManyToOne(() => CourtName, c => c.cases)
  court_name!: CourtName;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "text", nullable: true })
  notes!: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  created_on!: Date;

  @Column({ type: "timestamp", default: () => "NOW()" })
  last_updated!: Date;

  @OneToMany(() => CaseClient, cc => cc.case)
  clients!: CaseClient[];

  @OneToMany(() => Hearing, h => h.case)
  hearings!: Hearing[];

  @OneToMany(() => HearingLog, h => h.case)
  hearing_logs!: HearingLog[];

  @OneToMany(() => CaseOpponent, o => o.case)
  opponents!: CaseOpponent[];

  @OneToMany(() => CaseDefendant, d => d.case)
  defendants!: CaseDefendant[];
}
