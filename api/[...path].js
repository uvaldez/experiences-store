// Vercel serverless entry: the Express app is itself a (req, res) handler,
// so every /api/* request is routed straight into it.
import app from "../server/app.js";

export default app;
