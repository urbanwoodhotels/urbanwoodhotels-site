import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { storagePut } from "../storage";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const ADMIN_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_admin");

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, ADMIN_SECRET);
    return true;
  } catch {
    return false;
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Image upload route (admin only)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/upload-image", upload.single("file"), async (req, res) => {
    try {
      // Verify admin token
      const authHeader = req.headers["authorization"];
      const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token || !(await verifyAdminToken(token))) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const ext = req.file.originalname.split(".").pop() ?? "jpg";
      const key = `quiz-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url, key });
    } catch (err) {
      console.error("Image upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
