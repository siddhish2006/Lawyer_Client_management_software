import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";

// Entities
import { User } from "../entities/User";
import { Client } from "../entities/Client";
import { ClientType } from "../entities/ClientType";
import { Case } from "../entities/Case";
import { CaseClient } from "../entities/CaseClient";
import { CaseStatus } from "../entities/CaseStatus";
import { CaseType } from "../entities/CaseType";
import { CaseCategory } from "../entities/CaseCategory";
import { District } from "../entities/District";
import { CourtComplex } from "../entities/CourtComplex";
import { CourtName } from "../entities/CourtName";
import { Hearing } from "../entities/Hearing";
import { HearingLog } from "../entities/HearingLog";
import { Opponent } from "../entities/Opponent";
import { Defendant } from "../entities/Defendant";
import { CaseOpponent } from "../entities/CaseOpponent";
import { CaseDefendant } from "../entities/CaseDefendant";
import { Reminder } from "../entities/reminder";

/**
 * Central TypeORM DataSource.
 * This is the single DB connection used everywhere.
 */
const isNeonDB = env.DB.HOST.includes("neon.tech");
const isDev = process.env.NODE_ENV === "development";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB.HOST,
  port: env.DB.PORT,
  username: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,

  // SSL Configuration for Neon
  ssl: isNeonDB ? { rejectUnauthorized: false } : false,

  // Schema sync - enabled for initial setup
  // TODO: Disable in production, use migrations
  synchronize: true,

  // Logging - show queries in dev
  logging: isDev,
  logger: "simple-console",

  // Connection pool settings
  extra: {
    max: 20, // Max connections in pool
    min: 2, // Min connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // All entities
  entities: [
    User,
    Client,
    ClientType,
    Case,
    CaseClient,
    CaseStatus,
    CaseType,
    CaseCategory,
    District,
    CourtComplex,
    CourtName,
    Hearing,
    HearingLog,
    Opponent,
    Defendant,
    CaseOpponent,
    CaseDefendant,
    Reminder,
  ],
});
