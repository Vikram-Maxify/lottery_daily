import { io } from "socket.io-client";

// Production + Local dono me kaam karega
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:6099";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Debug logs (optional — production me hata sakte ho)
socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
socket.on("disconnect", (r) => console.log("❌ Socket disconnected:", r));
socket.on("connect_error", (e) => console.error("⚠️ Socket error:", e.message));