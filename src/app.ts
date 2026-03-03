import express from "express";
import hearingRoutes from "./routes/hearing.routes";
import clientRoutes from "./routes/client.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    message: "Client Management API is running",
  });
});

// 🔥 ROUTES (THIS IS THE IMPORTANT PART)
app.use("/hearings", hearingRoutes);
app.use("/clients", clientRoutes);

// MUST BE LAST
app.use(errorMiddleware);

export default app;
