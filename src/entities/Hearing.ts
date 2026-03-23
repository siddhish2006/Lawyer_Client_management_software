import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";

@Entity("hearings")
export class Hearing {
  @PrimaryGeneratedColumn()
  hearing_id!: number;

  @ManyToOne(() => Case, c => c.hearings)
  @JoinColumn({ name: "case_id" })
  case!: Case;

  @Column({ type: "date", nullable: true })
  hearing_date!: Date;

  @Column({ type: "text", nullable: true })
  purpose!: string;

  @Column({ type: "text", nullable: true })
  requirements!: string;

  @Column({ type: "timestamptz", nullable: true })
  created_on!: Date;
}
