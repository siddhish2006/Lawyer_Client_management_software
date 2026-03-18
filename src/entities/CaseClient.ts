import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";
import { Client } from "./Client";

@Entity("case_clients")
export class CaseClient {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Case, c => c.clients)
  @JoinColumn({ name: "case_id" })
  case!: Case;

  @ManyToOne(() => Client, c => c.case_links)
  @JoinColumn({ name: "client_id" })
  client!: Client;
}
