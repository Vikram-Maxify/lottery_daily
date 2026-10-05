const cron = require("node-cron");

const LotteryNumber = require("../models/LotteryNumber");

const {
  createDailyNumbersForDate,
  getIndiaDate,
} = require("../controllers/lotteryNumberController");

// =====================================================
// CRON 1: 00:01 AM IST -> AUTO-CREATE 100 NUMBERS
// =====================================================

function scheduleCreateDailyNumbers() {
  cron.schedule(
    "00 01 * * *", // 10:55 AM IST (for testing)
    async () => {
      try {
        const batchDate = getIndiaDate();

        console.log(
          `[CRON] 01:00 AM — Auto-creating numbers for ${batchDate}`
        );

        const result = await createDailyNumbersForDate(batchDate);

        console.log("[CRON] Auto-create result:", result);
      } catch (error) {
        console.error(
          "[CRON] Auto-create daily numbers error:",
          error
        );
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log(
    "[CRON] Auto-create job scheduled (10:55 AM IST)."
  );
}

// =====================================================
// CRON 2: 09:00 AM IST -> SELL TODAY'S NUMBERS
// =====================================================

function scheduleSellDailyNumbers() {
  cron.schedule(
    "*/4 * * * * *", // every 4 seconds
    async () => {
      try {
        const batchDate = getIndiaDate();

        const ticket = await LotteryNumber.findOneAndUpdate(
          {
            batchDate,
            status: "available",
          },
          {
            $set: {
              status: "sold",
              soldAt: new Date(),
            },
          },
          {
            returnDocument: "after",
          }
        );

        if (ticket) {
          console.log(
            `[CRON] Sold 1 ticket | Date: ${batchDate} | Ticket Number: ${
              ticket.number || ticket.ticketNumber
            }`
          );
        } else {
          console.log(
            `[CRON] No available tickets left for ${batchDate}`
          );
        }
      } catch (error) {
        console.error(
          "[CRON] Sell daily numbers error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "[CRON] Sell job scheduled (every 4 seconds IST)."
  );
}

// =====================================================
// START ALL JOBS
// =====================================================

const startLotteryNumberJobs = () => {
  scheduleCreateDailyNumbers();
  scheduleSellDailyNumbers();

  console.log("[CRON] All lottery number jobs started.");
};

module.exports = { startLotteryNumberJobs };