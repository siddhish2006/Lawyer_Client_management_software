import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from "typeorm";

export enum ResourceType {
  Client = "client",
  Case = "case",
}

@Entity("user_resource_map")
@Unique("uniq_user_resource", ["user_uuid", "resource_type", "resource_id"])
export class UserResourceMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: "uuid", nullable: false })
  user_uuid!: string;

  @Column({ type: "text", nullable: false })
  resource_type!: ResourceType;

  @Index()
  @Column({ type: "int", nullable: false })
  resource_id!: number;

  @Column({ type: "timestamptz", nullable: false, default: () => "now()" })
  created_at!: Date;
}
