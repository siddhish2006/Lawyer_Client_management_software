import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Client } from "./Client";
import { CaseDefendant } from "./CaseDefendant";

@Entity("defendants")
export class Defendant {
  @PrimaryGeneratedColumn()
  defendant_id!: number;

  @ManyToOne(() => Client, c => c.defendant_links, { nullable: true })
  @JoinColumn({ name: "client_id" })
  client!: Client | null;

  @Column({ type: "text", nullable: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  phone_number!: string;

  @Column({ type: "text", nullable: true })
  email!: string;

  @OneToMany(() => CaseDefendant, cd => cd.defendant)
  case_links!: CaseDefendant[];
}
