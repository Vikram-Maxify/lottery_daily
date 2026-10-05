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
    "1 0 * * *", // minute 1, hour 0 → 00:01
    async () => {
      try {
        const batchDate = getIndiaDate();

        console.log(
          `[CRON] 00:01 AM — Auto-creating numbers for ${batchDate}`
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
    "[CRON] Auto-create job scheduled (00:01 AM IST)."
  );
}

// =====================================================
// CRON 2: 09:00 AM IST -> SELL TODAY'S NUMBERS
// =====================================================

function scheduleSellDailyNumbers() {
  cron.schedule(
    "0 9 * * *", // 09:00 AM
    async () => {
      try {
        const batchDate = getIndiaDate();

        console.log(
          `[CRON] 09:00 AM — Selling numbers for ${batchDate}`
        );

        const result = await LotteryNumber.updateMany(
          {
            batchDate,
            status: "available",
          },
          {
            $set: {
              status: "sold",
              soldAt: new Date(),
            },
          }
        );

        console.log(
          `[CRON] Sold count: ${result.modifiedCount}`
        );
      } catch (error) {
        console.error(
          "[CRON] Sell daily numbers error:",
          error
        );
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log(
    "[CRON] Sell job scheduled (09:00 AM IST)."
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