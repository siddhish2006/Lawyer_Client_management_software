import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { CaseOpponent } from "./CaseOpponent";

@Entity("opponents")
export class Opponent {
  @PrimaryGeneratedColumn()
  opponent_id!: number;

  @Column({ type: "text", nullable: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  phone_number!: string;

  @Column({ type: "text", nullable: true })
  email!: string;

  @OneToMany(() => CaseOpponent, co => co.opponent)
  case_links!: CaseOpponent[];
}
