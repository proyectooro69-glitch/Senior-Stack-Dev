import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);
const port = parseInt(process.env.PORT || "5000", 10);
const distPath = path.resolve(process.cwd(), "dist", "public");
const indexPath = path.resolve(distPath, "index.html");
let appReady = false;

// Health checks - immediate
app.get("/health", (_req, res) => res.status(200).send("OK"));
app.get("/__health", (_req, res) => res.status(200).json({ status: "healthy" }));

// Root - serve index.html or health check response
app.get("/", (_req, res) => {
  if (appReady && fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("OK");
  }
});

// Start IMMEDIATELY
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
  setupApp();
});

async function setupApp() {
  try {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    const { registerRoutes } = await import("./routes");
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Error" });
    });

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use("*", (_req, res) => res.sendFile(indexPath));
      appReady = true;
      console.log("Ready");
    }
  } catch (e) {
    console.error("Setup error:", e);
  }
}
