import "reflect-metadata";
import app from "./app";
import { DatabaseConnection } from "./utils/database";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database connection using utility
    await DatabaseConnection.initialize();

    // Start Express server
    app.listen(PORT, () => {
      logger.success(`Server running on http://localhost:${PORT}`);
      logger.info(`📝 API available at http://localhost:${PORT}`);
      logger.info(`🧪 Test endpoints with: npm run test`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

startServer();
