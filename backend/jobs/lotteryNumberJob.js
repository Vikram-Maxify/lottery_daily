const cron = require("node-cron");

const LotteryNumber = require("../models/LotteryNumber");

// =====================================================
// GET DATE
// =====================================================

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// 9:00 AM -> SELL TODAY NUMBERS
// =====================================================

const startLotteryNumberJob = () => {
  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        const batchDate = getTodayDate();

        console.log(
          `9 AM reached. Selling numbers for ${batchDate}`
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
          `Numbers sold: ${result.modifiedCount}`
        );
      } catch (error) {
        console.error(
          "Lottery 9 AM Job Error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "Lottery number 9 AM job started."
  );
};

module.exports = startLotteryNumberJob;