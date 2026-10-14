const cron = require("node-cron");
const LotteryConfig = require("../models/LotteryConfig");

// =====================================================
// ⚠️ TIMEZONE NOTE
// Server ko IST par chalao: env me TZ=Asia/Kolkata set karo
// (pm2 ecosystem / .env / Dockerfile / hosting panel).
// Warna new Date(), setHours(), getDate() UTC me chalenge
// aur 12 AM IST par "aaj" ki date galat aa sakti hai.
// =====================================================

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
// HELPER: SYNC isActive FLAGS
// Target din ki SAARI lotteries active, baaki sab inactive.
// Create ho ya skip (already exists), dono case me chalega.
// =====================================================

const syncActiveFlags = async (targetDate) => {
  const { start, end } = getDayRange(targetDate);

  // Safety: agar target din ki ek bhi lottery nahi hai to
  // kuch bhi deactivate mat karo (warna sab inactive ho jayega)
  const targetCount = await LotteryConfig.countDocuments({
    drawDate: { $gte: start, $lte: end },
  });

  if (targetCount === 0) {
    console.log(
      `⚠️ ${formatDateString(targetDate)} ki koi lottery nahi mili, active flags change nahi kiye`,
    );
    return;
  }

  // 1) Target din ki saari lotteries -> active
  const activated = await LotteryConfig.updateMany(
    { drawDate: { $gte: start, $lte: end }, isActive: { $ne: true } },
    { $set: { isActive: true } },
  );

  // 2) Baaki sab (purani + future) -> inactive
  const deactivated = await LotteryConfig.updateMany(
    {
      isActive: true,
      $or: [{ drawDate: { $lt: start } }, { drawDate: { $gt: end } }],
    },
    { $set: { isActive: false } },
  );

  console.log(
    `🔄 Active flags synced for ${formatDateString(targetDate)} ` +
      `(activated: ${activated.modifiedCount}, deactivated: ${deactivated.modifiedCount})`,
  );
};

// =====================================================
// CREATE NEXT DAY LOTTERIES FOR ALL ACTIVE MARKETS
// referenceDate = jis din ki lotteries process karni hain
// (default = aaj, lekin cron me yesterday pass karenge)
// =====================================================

const createNextDayLotteries = async (referenceDate = new Date()) => {
  const startTime = new Date();

  const { start: refStart, end: refEnd } = getDayRange(referenceDate);
  const { end: todayEnd } = getDayRange(new Date());

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

    let refLotteries = await LotteryConfig.find({
      drawDate: { $gte: refStart, $lte: refEnd },
    }).lean();

    console.log(
      `📋 ${formatDateString(refStart)} ki total lotteries mili: ${refLotteries.length}`,
    );

    // If no lotteries found for exact referenceDate, fallback to latest config per market
    if (!refLotteries || refLotteries.length === 0) {
      console.log(`ℹ️ Checking latest config per market...`);
      const distinctMarkets = await LotteryConfig.distinct("marketName");
      refLotteries = [];
      for (const mName of distinctMarkets) {
        const latest = await LotteryConfig.findOne({ marketName: mName })
          .sort({ drawDate: -1, createdAt: -1 })
          .lean();
        if (latest) {
          refLotteries.push(latest);
        }
      }
      console.log(
        `📋 Found ${refLotteries.length} latest lotteries by distinct markets`,
      );
    }

    if (refLotteries.length === 0) {
      console.log("ℹ️ Koi lottery nahi mili. Cron job end.");
      console.log("==============================================");
      return;
    }

    // =====================================================
    // TARGET DAY (referenceDate + 1), normalized to midnight
    // Template.drawDate + 1 nahi, kyunki template future config
    // ho sakta hai aur markets aage aage bante rehte.
    // =====================================================

    const nextDate = new Date(referenceDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);

    const { start: nextStart, end: nextEnd } = getDayRange(nextDate);
    const nextDateString = formatDateString(nextDate);

    // =====================================================
    // HAR MARKET KE LIYE NEXT DAY LOTTERY CREATE KARO
    // =====================================================

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const refLottery of refLotteries) {
      try {
        const marketName = refLottery.marketName;

        // Resolve banner image: from refLottery, or fallback to any existing config of this market
        let imageUrl = refLottery.imageUrl || null;

        if (!imageUrl) {
          const prevWithImg = await LotteryConfig.findOne({
            marketName,
            imageUrl: { $exists: true, $nin: [null, ""] },
          })
            .sort({ createdAt: -1 })
            .lean();

          if (prevWithImg?.imageUrl) {
            imageUrl = prevWithImg.imageUrl;
            console.log(
              `🖼️ Auto-resolved banner for ${marketName}: ${imageUrl}`,
            );
          }
        }

        // Auto-repair any older configs of this market where imageUrl is missing
        if (imageUrl) {
          await LotteryConfig.updateMany(
            {
              marketName,
              $or: [
                { imageUrl: { $exists: false } },
                { imageUrl: null },
                { imageUrl: "" },
              ],
            },
            { $set: { imageUrl } },
          );
        }

        // Never create markets for future days — only up to today
        if (nextStart > todayEnd) {
          console.log(
            `⏭️ SKIP: ${marketName} - ${nextDateString} (future date, not created in advance)`,
          );
          skippedCount++;
          continue;
        }

        // =====================================================
        // CHECK: NEXT DAY LOTTERY ALREADY EXIST?
        // =====================================================

        const existingNext = await LotteryConfig.findOne({
          marketName,
          drawDate: { $gte: nextStart, $lte: nextEnd },
        }).lean();

        if (existingNext) {
          // If existing next lottery has no imageUrl, repair it immediately
          if (!existingNext.imageUrl && imageUrl) {
            await LotteryConfig.findByIdAndUpdate(existingNext._id, {
              imageUrl,
            });
            console.log(
              `🖼️ REPAIRED existing next lottery: ${marketName} - ${nextDateString} with banner image`,
            );
          }

          console.log(
            `⏭️ SKIP: ${marketName} - ${nextDateString} (already exists)`,
          );
          skippedCount++;
          continue;
        }

        // =====================================================
        // CREATE NEXT DAY LOTTERY
        // (isActive yahan true set hota hai, final sync loop ke baad)
        // =====================================================

        const nextLottery = await LotteryConfig.create({
          marketName,

          imageUrl: imageUrl || null,

          month: nextDate.getMonth() + 1,

          year: nextDate.getFullYear(),

          drawDate: nextDate,

          drawTime: refLottery.drawTime,

          prizes: {
            first: refLottery.prizes?.first || 0,
            second: refLottery.prizes?.second || 0,
            third: refLottery.prizes?.third || 0,
            fourth: refLottery.prizes?.fourth || 0,
            fifth: refLottery.prizes?.fifth || 0,
          },

          users: [],

          isActive: true,
        });

        console.log(
          `✅ CREATED: ${marketName} - ${nextDateString} (id: ${nextLottery._id}, image: ${imageUrl ? "yes" : "no"})`,
        );

        createdCount++;
      } catch (marketError) {
        // Duplicate key error (race condition) — skip
        if (marketError.code === 11000) {
          console.log(`⏭️ SKIP (duplicate): ${refLottery.marketName}`);
          skippedCount++;
        } else {
          console.error(
            `❌ ERROR for market ${refLottery.marketName}:`,
            marketError.message,
          );
          errorCount++;
        }
      }
    }

    // =====================================================
    // SYNC ACTIVE FLAGS (loop ke BAAD, sirf ek baar)
    // Target din ki saari market lotteries active,
    // baaki sab inactive. Create/skip dono case cover.
    // =====================================================

    if (nextStart <= todayEnd) {
      try {
        await syncActiveFlags(nextDate);
      } catch (syncError) {
        console.error("❌ ERROR syncing active flags:", syncError.message);
        errorCount++;
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
  // Startup par (3s baad): aaj ki lottery exist kare + isActive flags sync ho
  setTimeout(async () => {
    try {
      console.log("🔄 Initializing lottery check & banner repair...");
      // Yesterday pass karo taaki target day = TODAY ho
      const yesterdayStart = new Date();
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      await createNextDayLotteries(yesterdayStart);
    } catch (err) {
      console.error("❌ Startup lottery check error:", err.message);
    }
  }, 3000);

  // Cron expression: "0 0 * * *"  →  Roz raat 12:00 AM
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("\n🕛 Cron triggered at 12:00 AM IST");

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await createNextDayLotteries(yesterday);
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    },
  );

  console.log("✅ Lottery cron job scheduled (daily 12:00 AM IST)");
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  startLotteryCron,
  createNextDayLotteries, // manual trigger ke liye bhi export
  syncActiveFlags,
};