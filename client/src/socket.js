import { io } from "socket.io-client";
import api from "./reducer/api";

const resolveSocketUrl = () => {
  try {
    if (import.meta.env?.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }

    const apiBase = api?.defaults?.baseURL || "";
    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      return new URL(apiBase).origin;
    }

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return "http://localhost:6099";
      }
      return window.location.origin;
    }
  } catch {
    // fallback below
  }
  return "https://dearlottery1.com";
};

export const SOCKET_URL = resolveSocketUrl();

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
});

/**
 * Ensures the active socket connection has authenticated with the latest session cookie.
 * If the socket connected before login, reconnects once so handshake cookies are sent.
 */
export const ensureSocketAuthenticated = () =>
  new Promise((resolve) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("support:init", {}, (res) => {
      if (res?.authenticated) {
        resolve(res);
        return;
      }

      // Reconnect once to pick up freshly set httpOnly auth cookie
      socket.disconnect().connect();
      const onReconnect = () => {
        socket.off("connect", onReconnect);
        socket.emit("support:init", {}, (retryRes) => {
          resolve(retryRes || { authenticated: false });
        });
      };
      socket.on("connect", onReconnect);
    });
  });

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("⚠️ Socket error:", error.message);
});

export default socket;
