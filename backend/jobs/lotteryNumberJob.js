const cron = require("node-cron");
const LotteryNumber = require("../models/LotteryNumber");
const {
  createDailyNumbersForDate,
  getIndiaDate,
} = require("../controllers/lotteryNumberController");
const socketManager = require("../socket"); // ✅

function scheduleCreateDailyNumbers() {
  cron.schedule(
    "33 10 * * *",
    async () => {
      try {
        const batchDate = getIndiaDate();
        console.log(`[CRON] 01:00 AM — Auto-creating numbers for ${batchDate}`);

        const result = await createDailyNumbersForDate(batchDate);
        console.log("[CRON] Auto-create result:", result);

        socketManager.getIO().emit("numbersCreated", {
          batchDate,
          total: result?.total || 100,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("[CRON] Auto-create daily numbers error:", error);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("[CRON] Auto-create job scheduled (01:00 AM IST).");
}

function scheduleSellDailyNumbers() {
  cron.schedule(
    "*/15 * * * * *",
    async () => {
      try {
        const batchDate = getIndiaDate();

        const ticket = await LotteryNumber.findOneAndUpdate(
          { batchDate, status: "available" },
          { $set: { status: "sold", soldAt: new Date() } },
          { returnDocument: "after" },
        );

        const io = socketManager.getIO();

        if (ticket) {
          const payload = {
            batchDate,
            ticketNumber: ticket.number || ticket.ticketNumber,
            ticketId: ticket._id,
            soldAt: ticket.soldAt,
            timestamp: new Date().toISOString(),
          };

          console.log(
            `[CRON] Sold 1 ticket | Date: ${batchDate} | Ticket: ${payload.ticketNumber}`,
          );

          io.emit("ticketSold", payload);

          const remaining = await LotteryNumber.countDocuments({
            batchDate,
            status: "available",
          });

          io.emit("stockUpdate", { batchDate, remaining });
        } else {
          io.emit("soldOut", { batchDate });
        }
      } catch (error) {
        console.error("[CRON] Sell daily numbers error:", error);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("[CRON] Sell job scheduled (every 4 seconds IST).");
}

const startLotteryNumberJobs = () => {
  scheduleCreateDailyNumbers();
  scheduleSellDailyNumbers();
  console.log("[CRON] All lottery number jobs started.");
};

module.exports = { startLotteryNumberJobs };
