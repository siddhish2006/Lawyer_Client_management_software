import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

export enum OtpPurpose {
  Register = "register",
  Login = "login",
  Reset = "reset",
}

@Entity("otp_codes")
export class OtpCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: "uuid", nullable: false })
  user_uuid!: string;

  @Column({ type: "text", nullable: false })
  purpose!: OtpPurpose;

  @Column({ type: "text", nullable: false })
  code_hash!: string;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "timestamptz", nullable: false })
  expires_at!: Date;

  @Column({ type: "timestamptz", nullable: true })
  consumed_at!: Date | null;

  @Column({ type: "timestamptz", nullable: false, default: () => "now()" })
  created_at!: Date;
}
