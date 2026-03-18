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

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone_number!: string;

  @Column({ nullable: true })
  email!: string;

  @OneToMany(() => CaseDefendant, cd => cd.defendant)
  case_links!: CaseDefendant[];
}
