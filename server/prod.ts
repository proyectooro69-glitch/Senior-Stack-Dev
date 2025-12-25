import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

const app = express();
const httpServer = createServer(app);
const port = parseInt(process.env.PORT || "5000", 10);
const distPath = path.resolve(process.cwd(), "dist", "public");
const indexPath = path.resolve(distPath, "index.html");

// FIRST: Root endpoint for health checks - MUST respond with content
app.get("/", (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("OK");
  }
});

// Health check endpoints
app.get("/health", (_req, res) => res.status(200).send("OK"));
app.get("/__health", (_req, res) => res.status(200).json({ status: "healthy" }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
registerRoutes(httpServer, app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({ message: err.message || "Error" });
});

// Static files for non-root paths
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Catch-all for SPA routing (except root which is handled above)
  app.use("*", (_req, res) => res.sendFile(indexPath));
}

// Start server and keep running
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
