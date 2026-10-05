import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function LiveTickets() {
  const [tickets, setTickets] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [connected, setConnected] = useState(false);
  const [batchDate, setBatchDate] = useState(null);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onTicketSold = (data) => {
      console.log("🎟️ Ticket sold:", data);
      setBatchDate(data.batchDate);
      setTickets((prev) => [data, ...prev].slice(0, 100));
    };

    const onStockUpdate = (data) => {
      setRemaining(data.remaining);
      setBatchDate(data.batchDate);
    };

    const onSoldOut = (data) => {
      setRemaining(0);
      console.warn("❌ Sold out:", data);
    };

    const onNumbersCreated = (data) => {
      console.log("🆕 Numbers created:", data);
      setBatchDate(data.batchDate);
      setRemaining(data.total);
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
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">🎟️ Live Lottery Tickets</h1>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            connected
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {connected ? "● Live" : "○ Offline"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Batch Date</p>
          <p className="text-lg font-bold">{batchDate || "—"}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border">
          <p className="text-sm text-gray-500">Remaining Tickets</p>
          <p className="text-2xl font-bold text-blue-600">
            {remaining ?? "—"}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border">
        <div className="px-4 py-3 border-b bg-gray-50 font-semibold">
          Recently Sold ({tickets.length})
        </div>
        {tickets.length === 0 ? (
          <p className="p-6 text-center text-gray-400">
            Waiting for tickets to be sold...
          </p>
        ) : (
          <ul className="divide-y max-h-[500px] overflow-y-auto">
            {tickets.map((t, i) => (
              <li
                key={t.ticketId || i}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-mono text-lg font-semibold text-green-600">
                  🎟️ #{t.ticketNumber}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(t.soldAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}