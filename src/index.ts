import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8000;

// --- Jalankan Server ---
app.listen(PORT, () => {
  console.log(`⚡️ Server berjalan di http://localhost:${PORT}`);
});
