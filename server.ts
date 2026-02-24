import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Proxy to fetch data from public URL to avoid CORS
app.get("/api/proxy-csv", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const response = await axios.get(url as string, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    
    // Handle SPA routing - redirect all non-API requests to index.html
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Only listen if not running as a Vercel function
  if (process.env.VITE_VERCEL !== "true") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
