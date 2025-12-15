import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}/api`;

// --- Jalankan Server ---
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running!`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   API URL: ${API_BASE_URL}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Swagger: http://localhost:${PORT}/api-docs\n`);
});
