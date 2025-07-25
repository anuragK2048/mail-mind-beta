import initializeApp from "./app";
import { PORT, NODE_ENV } from "./config";

const startServer = async () => {
  try {
    const app = await initializeApp();
    app.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
