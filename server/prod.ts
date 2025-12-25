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

// Health checks FIRST
app.get("/health", (_req, res) => res.status(200).send("OK"));
app.get("/__health", (_req, res) => res.status(200).json({ status: "healthy" }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes (sync registration)
registerRoutes(httpServer, app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({ message: err.message || "Error" });
});

// Static files
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use("*", (_req, res) => res.sendFile(indexPath));
}

// Start server
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
