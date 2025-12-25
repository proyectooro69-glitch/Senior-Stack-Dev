import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || "5000", 10);

let ready = false;
let indexHtml = "";

// Pre-load index.html synchronously before starting
const dist = path.resolve(process.cwd(), "dist", "public");
const indexPath = path.resolve(dist, "index.html");
if (fs.existsSync(indexPath)) {
  indexHtml = fs.readFileSync(indexPath, "utf-8");
}

// Health check endpoints - always return 200
app.get("/health", (_, res) => res.send("OK"));
app.get("/__health", (_, res) => res.json({ status: "ok" }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
}

// Single "/" handler - returns cached HTML immediately
app.get("/", (_, res) => {
  res.type("html").send(indexHtml || "OK");
});

// SPA fallback
app.use("*", (_, res) => {
  res.type("html").send(indexHtml || "Not Found");
});

// Start listening
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server on port ${PORT}`);
  loadRoutes();
});

async function loadRoutes() {
  try {
    const { registerRoutes } = await import("./routes");
    await registerRoutes(server, app);
    ready = true;
    console.log("Routes loaded");
  } catch (e) {
    console.error("Route load error:", e);
  }
}
