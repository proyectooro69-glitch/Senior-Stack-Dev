import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || "5000", 10);

// Pre-load index.html synchronously BEFORE anything else
const dist = path.resolve(process.cwd(), "dist", "public");
const indexPath = path.resolve(dist, "index.html");
const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf-8") : "OK";

// Health checks FIRST - including "/" for default health check
app.get("/", (_, res) => res.type("html").send(indexHtml));
app.get("/health", (_, res) => res.status(200).send("OK"));
app.get("/__health", (_, res) => res.status(200).json({ status: "ok" }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
}

// API routes
registerRoutes(server, app);

// SPA fallback for non-root paths
app.get("*", (_, res) => {
  res.type("html").send(indexHtml);
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
