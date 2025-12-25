import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);
const port = parseInt(process.env.PORT || "5000", 10);

// Health checks FIRST - immediate response
app.get("/health", (_req, res) => res.status(200).send("OK"));
app.get("/__health", (_req, res) => res.status(200).json({ status: "healthy" }));

// Start listening IMMEDIATELY
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
  
  // Setup everything else AFTER server is listening
  setupApp();
});

async function setupApp() {
  try {
    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Dynamic import to avoid blocking startup
    const { registerRoutes } = await import("./routes");
    await registerRoutes(httpServer, app);

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    // Static files
    const distPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(distPath)) {
      console.log(`Serving static from: ${distPath}`);
      
      app.use((_req, res, next) => {
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'self';"
        );
        next();
      });
      
      app.use(express.static(distPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
      
      console.log("App fully initialized");
    } else {
      console.error("Static files not found at:", distPath);
    }
  } catch (error) {
    console.error("Setup error:", error);
  }
}
