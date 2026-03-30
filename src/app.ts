import express from "express";
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
import reminderRoutes from "./routes/reminder.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { dbHealthCheck, attachDatabase } from "./middlewares/db.middleware";

const app = express();

app.use(express.json());

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
    res.status(503).json({
      status: "ERROR",
      database: "Connection failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 🔥 ROUTES (THIS IS THE IMPORTANT PART)
app.use("/auth", authRoutes);
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
app.use("/reminders", reminderRoutes);

// MUST BE LAST
app.use(errorMiddleware);

export default app;
