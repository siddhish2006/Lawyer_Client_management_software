import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Case } from "./Case";
import { Client } from "./Client";

@Entity("case_clients")
export class CaseClient {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, c => c.clients)
  case!: Case;

  @ManyToOne(() => Client, c => c.case_links)
  client!: Client;
}
