import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

export enum UserStatus {
  Active = "Active",
  Resigned = "Resigned",
}

export enum UserRole {
  Lawyer = "lawyer",
  Assistant = "assistant",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  user_id!: number;

  @Index({ unique: true })
  @Column({ type: "uuid", generated: "uuid", nullable: false })
  user_uuid!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 30, nullable: false })
  username!: string;

  @Column({ type: "text", nullable: true })
  full_name!: string;

  @Index({ unique: true })
  @Column({ type: "text", nullable: false })
  email!: string;

  @Column({ type: "text", nullable: true })
  phone_number!: string;

  @Column({ type: "text", nullable: true })
  whatsapp_number!: string;

  @Column({ type: "text", nullable: true })
  password_hash!: string;

  @Column({ type: "boolean", default: false })
  is_verified!: boolean;

  @Column({ type: "text", nullable: true })
  status!: UserStatus;

  @Column({ type: "timestamptz", nullable: true })
  created_on!: Date;

  @Column({ type: "timestamptz", nullable: true })
  last_login!: Date | null;

  @Column({ type: "text", nullable: true })
  role!: UserRole;
}
