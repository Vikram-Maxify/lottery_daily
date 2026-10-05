require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const http = require("http");                    // ✅ NEW
const { Server } = require("socket.io");         // ✅ NEW
const socketManager = require("./socket");       // ✅ NEW

// =======================
// DNS
// =======================
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// =======================
// CONFIG / ROUTES
// =======================
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const amountRoutes = require("./routes/amountRoutes");
const lotteryConfigRoutes = require("./routes/lotteryConfigRoutes");
const lotteryResultRoutes = require("./routes/lotteryResultRoutes");
const depositRoutes = require("./routes/depositRoutes");
const adminGatewayRoutes = require("./routes/adminGatewayRoutes");
const adminRoutes = require("./routes/adminRoutes");
const startLotteryDepositCron = require("./cron/lotteryDepositCron");
const { startLotteryCron } = require("./cron/lotteryCron");
const lotteryNumberRoutes = require("./routes/lotteryNumberRoutes");

// =======================
// APP
// =======================
const app = express();

// =======================
// TRUST PROXY
// =======================
app.set("trust proxy", 1);

// =======================
// RAW REQUEST LOGGER
// =======================
app.use((req, res, next) => {
  console.log(
    `[RAW HIT] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ip=${req.ip} ua=${req.headers["user-agent"] || ""}`
  );
  next();
});

// =======================
// CORS
// =======================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://www.setthelife.com",
      "https://setthelife.com",
    ],
    credentials: true,
  })
);

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =======================
// API ROUTES
// =======================

app.use("/api/auth", authRoutes);
app.use("/api", amountRoutes);
app.use("/api", depositRoutes);

// Lottery test route
app.get("/api/lottery/test", (req, res) => {
  console.log("🔥 LOTTERY TEST ROUTE HIT");
  res.status(200).json({ success: true, message: "LOTTERY ROUTE IS WORKING" });
});

app.use("/api/lottery", lotteryConfigRoutes);
app.use("/api/festival", require("./routes/fes_lottery_routes"));
app.use("/api/lottery-result", lotteryResultRoutes);
app.use("/api/festival-result", require("./routes/festiv.result"));
app.use("/api", adminGatewayRoutes);
app.use("/api", adminRoutes);

const kycRoutes = require("./routes/kycRoutes");
const adminKycRoutes = require("./routes/adminKycRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const { startLotteryNumberJobs } = require("./jobs/lotteryNumberJob");
const referralSettingRoutes = require("./routes/referralSettingRoutes");
const topWinnerRoutes = require("./routes/topWinnerRoutes");

app.use("/uploads", express.static("uploads"));
app.use("/api/kyc", kycRoutes);
app.use("/api/admin/kyc", adminKycRoutes);
app.use("/api/withdrawal", require("./routes/withdrawalRoutes"));
app.use("/api/banners", bannerRoutes);
app.use("/api/lottery-numbers", lotteryNumberRoutes);
app.use("/api/admin/settings", referralSettingRoutes);
app.use("/api/top-winners", topWinnerRoutes);
app.use("/api/festival-amount", require("./routes/festivalamountRoutes"));

// =======================
// HEALTH CHECK
// =======================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    port: PORT,
  });
});

// =======================
// REACT FRONTEND
// =======================
const clientPath = path.join(__dirname, "../client/dist");

app.use(express.static(clientPath));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }
  res.sendFile(path.join(clientPath, "index.html"));
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =======================
// PORT
// =======================
const PORT = process.env.PORT || 6099;

// =======================
// HTTP SERVER + SOCKET.IO  ✅ NEW
// =======================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://www.setthelife.com",
      "https://setthelife.com",
    ],
    credentials: true,
  },
});

// Socket instance globally register karo (cron isko use karega)
socketManager.init(io);

io.on("connection", (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`[SOCKET] ${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// =======================
// DATABASE + SERVER
// =======================
const startServer = async () => {
  try {
    await connectDB();

    console.log("🔥🔥🔥 THIS SERVER.JS IS RUNNING 🔥🔥🔥");
    console.log(`🔥 PORT CONFIG: ${PORT}`);

    // ⚠️ Cron jobs ko yahan start karo — DB connect + socket init ke BAAD
    startLotteryCron();
    startLotteryNumberJobs();

    server.listen(PORT, "0.0.0.0", () => {   // ✅ app.listen → server.listen
      console.log("=================================");
      console.log(`Server running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();