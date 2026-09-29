const cron = require("node-cron");

const syncLotteryDeposits = require(
  "../services/syncLotteryDeposits"
);


// ============================================================
// EVERY 30 MINUTES
// ============================================================

const startLotteryDepositCron = () => {

  cron.schedule(
    "*/30 * * * *",
    async () => {

      console.log(
        "Lottery deposit cron triggered..."
      );

      await syncLotteryDeposits();

    },
    {
      timezone: "Asia/Kolkata",
    }
  );


  console.log(
    "Lottery Deposit Cron Started: Every 30 Minutes"
  );
};


module.exports =
  startLotteryDepositCron;