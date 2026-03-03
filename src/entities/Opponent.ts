import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { CaseOpponent } from "./CaseOpponent";

@Entity("opponents")
export class Opponent {
  @PrimaryGeneratedColumn()
  opponent_id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone_number!: string;

  @Column({ nullable: true })
  email!: string;

  @OneToMany(() => CaseOpponent, co => co.opponent)
  case_links!: CaseOpponent[];
}
