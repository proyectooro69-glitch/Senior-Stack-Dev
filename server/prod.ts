import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || "5000", 10);

// ULTRA-FAST health check responses
app.get("/", (_, res) => res.send("OK"));
app.get("/health", (_, res) => res.send("OK"));
app.get("/__health", (_, res) => res.json({ status: "ok" }));

// Start listening FIRST
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on ${PORT}`);
  loadApp();
});

async function loadApp() {
  try {
    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Load routes dynamically
    const { registerRoutes } = await import("./routes");
    await registerRoutes(server, app);

    // Static files
    const dist = path.resolve(process.cwd(), "dist", "public");
    const index = path.resolve(dist, "index.html");
    
    if (fs.existsSync(dist)) {
      app.use(express.static(dist));
      
      // Override "/" to serve the actual app
      app._router.stack = app._router.stack.filter((r: any) => 
        !(r.route && r.route.path === "/" && r.route.methods.get)
      );
      app.get("/", (_, res) => res.sendFile(index));
      app.use("*", (_, res) => res.sendFile(index));
      
      console.log("App ready");
    }
  } catch (e) {
    console.error("Load error:", e);
  }
}
