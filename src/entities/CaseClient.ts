import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Case } from "./Case";
import { Client } from "./Client";

@Entity("case_clients")
@Unique("uq_case_clients_case_client", ["case", "client"])
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
