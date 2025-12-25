import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const port = parseInt(process.env.PORT || "5000", 10);

console.log("Starting production server...");

// CRITICAL: Health check endpoints registered IMMEDIATELY - no async
let appReady = false;
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/__health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});
// Root serves health check during startup, then passes to static files
app.get("/", (req, res, next) => {
  if (!appReady) {
    res.status(200).send("<!DOCTYPE html><html><body>OK</body></html>");
  } else {
    next();
  }
});

// CRITICAL: Start server IMMEDIATELY - before any async operations
httpServer.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});

// Now do async setup in background
(async () => {
  try {
    // Body parsing middleware
    app.use(
      express.json({
        verify: (req, _res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: false }));

    // Logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const reqPath = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (reqPath.startsWith("/api")) {
          let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      });

      next();
    });

    // Register API routes
    await registerRoutes(httpServer, app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Error:", err);
    });

    // Serve static files (includes fallback to index.html)
    serveStatic(app);

    // Mark app as ready - "/" will now serve static files
    appReady = true;
    log("All routes and middleware registered - app ready");
  } catch (error) {
    console.error("Failed to register routes:", error);
    process.exit(1);
  }
})();
