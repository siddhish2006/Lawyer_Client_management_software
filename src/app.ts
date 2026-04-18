import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hearingRoutes from "./routes/hearing.routes";
import clientRoutes from "./routes/client.routes";
import caseRoutes from "./routes/case.routes";
import authRoutes from "./routes/auth.routes";
import caseCategoryRoutes from "./routes/case-category.routes";
import caseStatusRoutes from "./routes/case-status.routes";
import caseTypeRoutes from "./routes/case-type.routes";
import clientTypeRoutes from "./routes/client-type.routes";
import courtComplexRoutes from "./routes/court-complex.routes";
import courtNameRoutes from "./routes/court-name.routes";
import defendantRoutes from "./routes/defendant.routes";
import districtRoutes from "./routes/district.routes";
import opponentRoutes from "./routes/opponent.routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { dbHealthCheck, attachDatabase } from "./middlewares/db.middleware";

const app = express();

app.use(helmet());

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// CORS — allow frontend dev origins (configurable via CORS_ORIGIN csv)
const allowedOrigins = (
  process.env.CORS_ORIGIN ??
  "http://localhost:3000,http://localhost:3001,http://localhost:3002"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// `*` with credentials is spec-invalid and unsafe — fail boot so it
// cannot be deployed by accident.
if (allowedOrigins.includes("*")) {
  throw new Error(
    "CORS_ORIGIN cannot contain '*' while credentials are enabled. Set explicit origins."
  );
}

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser requests (curl, server-to-server) which have no origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(globalRateLimiter);

// Database middleware (check health + attach instance)
app.use(dbHealthCheck);
app.use(attachDatabase);

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    message: "Client Management API is running",
  });
});

// Database status endpoint
app.get("/health/db", async (_req, res) => {
  try {
    const { DatabaseConnection } = await import("./utils/database");
    const isConnected = await DatabaseConnection.healthCheck();
    res.json({
      status: isConnected ? "OK" : "DISCONNECTED",
      database: isConnected ? "Connected" : "Failed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB health check failed:", error);
    res.status(503).json({
      status: "ERROR",
      database: "Connection failed",
    });
  }
});

// 🔥 ROUTES (THIS IS THE IMPORTANT PART)
app.use("/auth", authRateLimiter, authRoutes);
app.use("/hearings", hearingRoutes);
app.use("/clients", clientRoutes);
app.use("/cases", caseRoutes);
app.use("/case-categories", caseCategoryRoutes);
app.use("/case-statuses", caseStatusRoutes);
app.use("/case-types", caseTypeRoutes);
app.use("/client-types", clientTypeRoutes);
app.use("/court-complexes", courtComplexRoutes);
app.use("/court-names", courtNameRoutes);
app.use("/defendants", defendantRoutes);
app.use("/districts", districtRoutes);
app.use("/opponents", opponentRoutes);
app.use("/webhooks", webhookRoutes);

// MUST BE LAST
app.use(errorMiddleware);

export default app;
