import dotenv from "dotenv";
import path from "path";

// Load environment variables from a .env.test file if you have one,
// otherwise fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: false });

// You can add other global setup here if needed,
// like connecting to a test database or mocking global modules.
