const cron = require("node-cron");
const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// HELPER: FORMAT DATE AS YYYY-MM-DD
// =====================================================

const formatDateString = (date) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
};

// =====================================================
// CREATE NEXT DAY LOTTERIES FOR ALL ACTIVE MARKETS
// =====================================================

const createNextDayLotteries = async () => {
  const startTime = new Date();

  console.log("==============================================");
  console.log("🕛 LOTTERY CRON JOB STARTED");
  console.log("TIME:", startTime.toISOString());
  console.log("==============================================");

  try {
    // =====================================================
    // AAJ KI DATE RANGE
    // =====================================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // =====================================================
    // AAJ WALI SAARI LOTTERIES DHUNDO
    // (jo bhi market aaj draw ho rahi hain)
    // =====================================================

    const todayLotteries = await LotteryConfig.find({
      drawDate: { $gte: today, $lte: todayEnd },
    }).lean();

    console.log(
      `📋 Aaj ki total lotteries mili: ${todayLotteries.length}`
    );

    if (todayLotteries.length === 0) {
      console.log("ℹ️ Aaj koi lottery nahi mili. Cron job end.");
      console.log("==============================================");
      return;
    }

    // =====================================================
    // HAR MARKET KE LIYE NEXT DAY LOTTERY CREATE KARO
    // =====================================================

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const todayLottery of todayLotteries) {
      try {
        const marketName = todayLottery.marketName;

        // =====================================================
        // NEXT DAY DATE CALCULATE KARO
        // =====================================================

        const nextDate = new Date(todayLottery.drawDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const nextStartOfDay = new Date(nextDate);
        nextStartOfDay.setHours(0, 0, 0, 0);

        const nextEndOfDay = new Date(nextDate);
        nextEndOfDay.setHours(23, 59, 59, 999);

        const nextDateString = formatDateString(nextDate);

        // =====================================================
        // CHECK: NEXT DAY LOTTERY ALREADY EXIST?
        // =====================================================

        const existingNext = await LotteryConfig.findOne({
          marketName,
          drawDate: { $gte: nextStartOfDay, $lte: nextEndOfDay },
        });

        if (existingNext) {
          console.log(
            `⏭️ SKIP: ${marketName} - ${nextDateString} (already exists)`
          );
          skippedCount++;
          continue;
        }

        // =====================================================
        // CREATE NEXT DAY LOTTERY
        // =====================================================

        const nextLottery = await LotteryConfig.create({
          marketName,

          month: nextDate.getMonth() + 1,

          year: nextDate.getFullYear(),

          drawDate: nextDate,

          drawTime: todayLottery.drawTime,

          prizes: {
            first: todayLottery.prizes?.first || 0,
            second: todayLottery.prizes?.second || 0,
            third: todayLottery.prizes?.third || 0,
          },

          users: [],

          isActive: false,
        });

        console.log(
          `✅ CREATED: ${marketName} - ${nextDateString} (id: ${nextLottery._id})`
        );

        createdCount++;
      } catch (marketError) {
        // Duplicate key error (race condition) — skip
        if (marketError.code === 11000) {
          console.log(
            `⏭️ SKIP (duplicate): ${todayLottery.marketName}`
          );
          skippedCount++;
        } else {
          console.error(
            `❌ ERROR for market ${todayLottery.marketName}:`,
            marketError.message
          );
          errorCount++;
        }
      }
    }

    // =====================================================
    // SUMMARY
    // =====================================================

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("==============================================");
    console.log("📊 CRON JOB SUMMARY");
    console.log(`✅ Created : ${createdCount}`);
    console.log(`⏭️ Skipped : ${skippedCount}`);
    console.log(`❌ Errors  : ${errorCount}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log("==============================================");
  } catch (error) {
    console.error("❌ CRON JOB FATAL ERROR:", error);
    console.log("==============================================");
  }
};

// =====================================================
// START CRON JOB
// Roz 12:00 AM IST par chalega
// =====================================================

const startLotteryCron = () => {
  // Cron expression: "0 0 * * *"
  // Minute: 0, Hour: 0, Every day, Every month, Every day of week
  // = Roz raat 12:00 AM

  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("\n🕛 Cron triggered at 12:00 AM");
      await createNextDayLotteries();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );

  console.log("✅ Lottery cron job scheduled (daily 12:00 AM IST)");
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  startLotteryCron,
  createNextDayLotteries, // manual trigger ke liye bhi export
};