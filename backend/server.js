require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { getSettings } = require("./services/settings");

const app = express();
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

app.set("trust proxy", 1); // Render sits behind a proxy
app.disable("x-powered-by");

// Keep the raw body: needed later for payment-gateway signature checks.
const keepRaw = (req, res, buf) => {
  req.rawBody = buf.toString("utf8");
};
app.use(express.json({ limit: "1mb", verify: keepRaw }));
app.use(express.urlencoded({ extended: true, limit: "1mb", verify: keepRaw }));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limited", message: "Too many requests, slow down" },
  })
);

app.get("/healthz", (req, res) => res.json({ ok: true }));

// Mount a route file only if it exists (so you can deploy step by step).
function mount(urlPath, file) {
  const full = path.join(__dirname, "routes", file + ".js");
  if (fs.existsSync(full)) {
    app.use(urlPath, require(full));
    console.log("Route mounted:", urlPath);
  } else {
    console.warn("Route file missing (skipped):", "routes/" + file + ".js");
  }
}

mount("/api/user", "user");
mount("/api/tasks", "tasks");
mount("/api/club", "club");
mount("/api/referral", "referral");
mount("/api/wallet", "wallet");
mount("/api/payments", "payments"); // FINZO callbacks (no Telegram login)
mount("/api/admin", "admin");
mount("/bot", "bot"); // Telegram webhook

app.use("/api", (req, res) => res.status(404).json({ error: "not_found" }));

// Frontend (plain HTML/CSS/JS)
app.use(
  express.static(FRONTEND_DIR, {
    setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
  })
);
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status && err.status < 500 ? err.status : 500;
  res.status(status).json({
    error: "server_error",
    message: status < 500 ? err.message : "Something went wrong",
  });
});

// Optional services (bot webhook setup, background jobs) start if present.
function initService(name) {
  const full = path.join(__dirname, "services", name + ".js");
  if (!fs.existsSync(full)) return;
  const svc = require(full);
  if (svc && typeof svc.init === "function") {
    Promise.resolve(svc.init(app)).catch((e) =>
      console.error("Service init failed:", name, e.message)
    );
  }
}

async function start() {
  await connectDB();
  await getSettings(true); // creates default settings on first run
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log("TaskGenX running on port", port);
    initService("telegramBot");
    initService("jobs");
  });
}

start().catch((e) => {
  console.error("Failed to start:", e);
  process.exit(1);
});
