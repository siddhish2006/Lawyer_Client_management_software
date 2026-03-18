import express from "express";
import hearingRoutes from "./routes/hearing.routes";
import clientRoutes from "./routes/client.routes";
import caseRoutes from "./routes/case.routes";
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
app.use("/hearings", hearingRoutes);
app.use("/clients", clientRoutes);
app.use("/cases", caseRoutes);

// MUST BE LAST
app.use(errorMiddleware);

export default app;
