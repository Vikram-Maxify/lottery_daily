import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export default function TicketDashboard() {
  const [tickets, setTickets] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [total, setTotal] = useState(100);
  const [connected, setConnected] = useState(false);
  const [batchDate, setBatchDate] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      showToast("Connected to live updates", "success");
    };
    const onDisconnect = () => {
      setConnected(false);
      showToast("Disconnected from server", "error");
    };

    const onTicketSold = (data) => {
      setBatchDate(data.batchDate);
      setTickets((prev) => [data, ...prev].slice(0, 200));
      showToast(`Ticket #${data.ticketNumber} sold!`, "success");
    };

    const onStockUpdate = (data) => {
      setRemaining(data.remaining);
      setBatchDate(data.batchDate);
    };

    const onSoldOut = (data) => {
      setRemaining(0);
      setBatchDate(data.batchDate);
      showToast(`All tickets sold for ${data.batchDate}`, "warning");
    };

    const onNumbersCreated = (data) => {
      setBatchDate(data.batchDate);
      setTotal(data.total);
      setRemaining(data.total);
      setTickets([]);
      showToast(`New batch created: ${data.total} tickets`, "info");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("ticketSold", onTicketSold);
    socket.on("stockUpdate", onStockUpdate);
    socket.on("soldOut", onSoldOut);
    socket.on("numbersCreated", onNumbersCreated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("ticketSold", onTicketSold);
      socket.off("stockUpdate", onStockUpdate);
      socket.off("soldOut", onSoldOut);
      socket.off("numbersCreated", onNumbersCreated);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const soldCount = total && remaining !== null ? total - remaining : 0;
  const soldPercent =
    total && remaining !== null
      ? Math.round(((total - remaining) / total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white animate-slide-in ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "warning"
              ? "bg-yellow-500"
              : toast.type === "info"
              ? "bg-blue-500"
              : "bg-green-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              🎰 Lottery Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Batch: {batchDate || "Loading..."}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              connected
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {connected ? "● Live" : "○ Offline"}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-gray-800">{total}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Sold</p>
            <p className="text-3xl font-bold text-green-600">{soldCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-3xl font-bold text-orange-600">
              {remaining ?? "—"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Sale Progress</span>
            <span className="font-bold text-blue-600">{soldPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${soldPercent}%` }}
            />
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-white rounded-xl shadow border">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-gray-700">
              🔴 Live Sales Feed
            </span>
            <span className="text-xs text-gray-500">
              Showing last {tickets.length}
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-4xl mb-2">⏳</p>
              <p>Waiting for next ticket sale...</p>
            </div>
          ) : (
            <ul className="divide-y max-h-[450px] overflow-y-auto">
              {tickets.map((t, i) => (
                <li
                  key={t.ticketId || `${t.ticketNumber}-${i}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                      #{t.ticketNumber}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Ticket Sold
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.soldAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    SOLD
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}