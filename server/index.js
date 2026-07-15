import "dotenv/config";
import app from "./app.js";
import { isLive } from "./way.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `Server on http://localhost:${PORT} — ${isLive ? "LIVE (Way API)" : "MOCK"} mode`
  );
});
