import "reflect-metadata";
import app from "./app";

const PORT = process.env.PORT || 3000;

/**
 * TEMP BOOTSTRAP (NO DB)
 * --------------------
 * Database will be connected later.
 */
function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
