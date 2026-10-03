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
// HELPER: GET START & END OF DAY
// =====================================================

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// =====================================================
// CREATE NEXT DAY LOTTERIES FOR ALL ACTIVE MARKETS
// referenceDate = jis din ki lotteries process karni hain
// (default = aaj, lekin cron me yesterday pass karenge)
// =====================================================

const createNextDayLotteries = async (referenceDate = new Date()) => {
  const startTime = new Date();

  const { start: refStart, end: refEnd } = getDayRange(referenceDate);

  console.log("==============================================");
  console.log("🕛 LOTTERY CRON JOB STARTED");
  console.log("TIME:", startTime.toISOString());
  console.log("📅 PROCESSING DATE:", formatDateString(refStart));
  console.log("==============================================");

  try {
    // =====================================================
    // REFERENCE DATE WALI SAARI LOTTERIES DHUNDO
    // (jo bhi market us din draw ho rahi thi)
    // =====================================================

    const refLotteries = await LotteryConfig.find({
      drawDate: { $gte: refStart, $lte: refEnd },
    }).lean();

    console.log(
      `📋 ${formatDateString(refStart)} ki total lotteries mili: ${refLotteries.length}`
    );

    if (refLotteries.length === 0) {
      console.log("ℹ️ Koi lottery nahi mili. Cron job end.");
      console.log("==============================================");
      return;
    }

    // =====================================================
    // HAR MARKET KE LIYE NEXT DAY LOTTERY CREATE KARO
    // =====================================================

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const refLottery of refLotteries) {
      try {
        const marketName = refLottery.marketName;

        // =====================================================
        // NEXT DAY DATE CALCULATE KARO (normalized to midnight)
        // =====================================================

        const nextDate = new Date(refLottery.drawDate);
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(0, 0, 0, 0); // 🔥 normalize — time hata do

        const { start: nextStart, end: nextEnd } = getDayRange(nextDate);

        const nextDateString = formatDateString(nextDate);

        // =====================================================
        // CHECK: NEXT DAY LOTTERY ALREADY EXIST?
        // =====================================================

        const existingNext = await LotteryConfig.findOne({
          marketName,
          drawDate: { $gte: nextStart, $lte: nextEnd },
        }).lean();

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

          drawTime: refLottery.drawTime,

          prizes: {
            first: refLottery.prizes?.first || 0,
            second: refLottery.prizes?.second || 0,
            third: refLottery.prizes?.third || 0,
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
            `⏭️ SKIP (duplicate): ${refLottery.marketName}`
          );
          skippedCount++;
        } else {
          console.error(
            `❌ ERROR for market ${refLottery.marketName}:`,
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
    console.log(`📅 Processed date: ${formatDateString(refStart)}`);
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
//
// ⚠️ IMPORTANT: 12:00 AM par date change ho jati hai,
// isliye hum "yesterday" pass karte hain taaki us din
// ki lotteries (jo aaj draw hui thi) process ho sakein.
// =====================================================

const startLotteryCron = () => {
  // Cron expression: "0 0 * * *"  →  Roz raat 12:00 AM
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("\n🕛 Cron triggered at 12:00 AM IST");

      // 🔥 FIX: 12 AM par date already next day hai,
      // isliye previous day (yesterday) pass karo
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await createNextDayLotteries(yesterday);
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