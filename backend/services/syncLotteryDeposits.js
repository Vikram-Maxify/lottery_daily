const Deposit = require("../models/Deposit");
const Amount = require("../models/amountModel");
const LotteryConfig = require("../models/LotteryConfig");

/**
 * ============================================================
 * FORMAT DRAW DATE
 * ============================================================
 *
 * Input:
 * 2026-10-11T00:00:00.000Z
 *
 * Output:
 * 2026-10-11
 */
const formatDrawDate = (date) => {
  if (!date) {
    return null;
  }

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const year = d.getUTCFullYear();

  const month = String(
    d.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


/**
 * ============================================================
 * SYNC DEPOSITS TO LOTTERY CONFIG
 * ============================================================
 *
 * MAIN LOGIC:
 *
 * Deposit:
 *
 *   status = 0 OR 1
 *   amount = Amount.amount
 *   configId exists
 *   number = exactly 6 digits
 *
 * Then:
 *
 *   Find LotteryConfig using deposit.configId
 *
 *   Check:
 *
 *   Is deposit.userId already present
 *   inside config.users[] ?
 *
 *   YES:
 *      SKIP
 *
 *   NO:
 *      CREATE NEW OBJECT
 *
 * ============================================================
 */
const syncLotteryDeposits = async () => {
  try {
    console.log(
      "=================================================="
    );

    console.log(
      "LOTTERY DEPOSIT SYNC STARTED"
    );

    console.log(
      "TIME:",
      new Date().toISOString()
    );

    console.log(
      "=================================================="
    );


    // ========================================================
    // 1. GET LATEST AMOUNT CONFIG
    // ========================================================

    const amountConfig =
      await Amount.findOne()
        .sort({
          createdAt: -1,
        })
        .lean();


    // ========================================================
    // AMOUNT CONFIG NOT FOUND
    // ========================================================

    if (!amountConfig) {
      console.log(
        "Amount configuration not found."
      );

      return;
    }


    // ========================================================
    // GET REQUIRED AMOUNT
    // ========================================================

    const requiredAmount =
      Number(
        amountConfig.amount
      );


    // ========================================================
    // VALIDATE AMOUNT
    // ========================================================

    if (
      !Number.isFinite(
        requiredAmount
      )
    ) {
      console.log(
        "Invalid Amount.amount:",
        amountConfig.amount
      );

      return;
    }


    console.log(
      "Amount Schema Amount:",
      requiredAmount
    );


    // ========================================================
    // 2. FIND ELIGIBLE DEPOSITS
    // ========================================================
    //
    // STATUS:
    // 0 = pending
    // 1 = success
    //
    // BOTH WILL BE CHECKED.
    //
    // DO NOT CHECK entryId HERE.
    //
    // Because even if entryId is null,
    // user may need to be created.
    //
    // ========================================================

    const deposits =
      await Deposit.find({

        status: {
          $in: [0, 1],
        },

        configId: {
          $ne: null,
        },

        number: {
          $regex: /^\d{6}$/,
        },

      })
        .sort({
          createdAt: 1,
        });


    console.log(
      "Total Status 0/1 Deposits:",
      deposits.length
    );


    // ========================================================
    // NO DEPOSITS
    // ========================================================

    if (!deposits.length) {

      console.log(
        "No deposits found."
      );

      return;
    }


    // ========================================================
    // COUNTERS
    // ========================================================

    let createdCount = 0;

    let existingCount = 0;

    let amountMismatchCount = 0;

    let configNotFoundCount = 0;

    let invalidDepositCount = 0;

    let errorCount = 0;


    // ========================================================
    // 3. PROCESS EACH DEPOSIT
    // ========================================================

    for (
      const deposit of deposits
    ) {

      try {

        console.log(
          "--------------------------------------------------"
        );

        console.log(
          "Processing Deposit:",
          deposit._id
        );


        // ====================================================
        // 4. GET USER ID
        // ====================================================

        const depositUserId =
          String(
            deposit.userId || ""
          );


        // ====================================================
        // USER ID REQUIRED
        // ====================================================

        if (!depositUserId) {

          console.log(
            "User ID missing. Skipping:",
            deposit._id
          );

          invalidDepositCount++;

          continue;
        }


        // ====================================================
        // 5. GET DEPOSIT AMOUNT
        // ====================================================

        const depositAmount =
          Number(
            deposit.amount
          );


        // ====================================================
        // VALIDATE DEPOSIT AMOUNT
        // ====================================================

        if (
          !Number.isFinite(
            depositAmount
          )
        ) {

          console.log(
            "Invalid deposit amount:",
            {
              depositId:
                deposit._id,

              amount:
                deposit.amount,
            }
          );

          invalidDepositCount++;

          continue;
        }


        // ====================================================
        // 6. AMOUNT MUST MATCH AMOUNT SCHEMA
        // ====================================================

        if (
          depositAmount !==
          requiredAmount
        ) {

          console.log(
            "Amount mismatch:",
            {
              depositId:
                deposit._id,

              userId:
                depositUserId,

              depositAmount:
                depositAmount,

              requiredAmount:
                requiredAmount,
            }
          );

          amountMismatchCount++;

          continue;
        }


        // ====================================================
        // 7. CONFIG ID REQUIRED
        // ====================================================

        if (!deposit.configId) {

          console.log(
            "Config ID missing:",
            deposit._id
          );

          invalidDepositCount++;

          continue;
        }


        // ====================================================
        // 8. NUMBER VALIDATION
        // ====================================================

        const lotteryNumber =
          String(
            deposit.number || ""
          );


        if (
          !/^\d{6}$/.test(
            lotteryNumber
          )
        ) {

          console.log(
            "Invalid lottery number:",
            {
              depositId:
                deposit._id,

              number:
                deposit.number,
            }
          );

          invalidDepositCount++;

          continue;
        }


        // ====================================================
        // 9. FIND LOTTERY CONFIG
        // ====================================================

        const config =
          await LotteryConfig.findById(
            deposit.configId
          );


        // ====================================================
        // CONFIG NOT FOUND
        // ====================================================

        if (!config) {

          console.log(
            "LotteryConfig not found:",
            deposit.configId
          );

          configNotFoundCount++;

          continue;
        }


        // ====================================================
        // 10. GET DRAW DATE
        // ====================================================

        const entryDate =
          formatDrawDate(
            config.drawDate
          );


        // ====================================================
        // INVALID DRAW DATE
        // ====================================================

        if (!entryDate) {

          console.log(
            "Invalid draw date:",
            {
              configId:
                config._id,

              drawDate:
                config.drawDate,
            }
          );

          invalidDepositCount++;

          continue;
        }


        // ====================================================
        // 11. CHECK USER IN CONFIG
        // ====================================================
        //
        // THIS IS THE MOST IMPORTANT CHECK.
        //
        // We only check userId.
        //
        // entryId is NOT used for this check.
        //
        // ====================================================

        const userExists =
          Array.isArray(
            config.users
          ) &&
          config.users.some(
            (user) => {

              return (
                String(
                  user.userId
                ) ===
                depositUserId
              );

            }
          );


        // ====================================================
        // USER ALREADY EXISTS
        // ====================================================

        if (userExists) {

          console.log(
            "USER ALREADY EXISTS IN CONFIG - SKIP:",
            {
              depositId:
                deposit._id,

              userId:
                depositUserId,

              configId:
                config._id,
            }
          );

          existingCount++;

          continue;
        }


        // ====================================================
        // 12. USER DOES NOT EXIST
        //
        // CREATE NEW OBJECT
        // ====================================================

        const newUserEntry = {

          userId:
            depositUserId,

          entryDate:
            entryDate,

          number:
            lotteryNumber,

          amount:
            depositAmount,

          isBuy:
            true,

          prize: {

            first:
              0,

            second:
              0,

            third:
              0,
          },

          prizeType:
            null,

          status:
            "pending",
        };


        // ====================================================
        // 13. PUSH INTO USERS[]
        // ====================================================

        config.users.push(
          newUserEntry
        );


        // ====================================================
        // 14. SAVE LOTTERY CONFIG
        // ====================================================

        await config.save();


        // ====================================================
        // 15. GET NEWLY CREATED ENTRY
        // ====================================================

        const createdEntry =
          config.users[
            config.users.length - 1
          ];


        // ====================================================
        // 16. UPDATE DEPOSIT ENTRY ID
        // ====================================================
        //
        // This is only for reference.
        //
        // It is NOT used for deciding
        // whether user should be created.
        //
        // ====================================================

        if (
          createdEntry &&
          createdEntry._id
        ) {

          deposit.entryId =
            createdEntry._id;

          await deposit.save();
        }


        // ====================================================
        // 17. CREATED SUCCESSFULLY
        // ====================================================

        createdCount++;


        console.log(
          "**************************************************"
        );

        console.log(
          "NEW LOTTERY USER ENTRY CREATED"
        );

        console.log(
          {
            depositId:
              deposit._id,

            depositStatus:
              deposit.status,

            configId:
              config._id,

            userId:
              depositUserId,

            entryId:
              createdEntry?._id,

            number:
              lotteryNumber,

            amount:
              depositAmount,

            entryDate:
              entryDate,
          }
        );

        console.log(
          "**************************************************"
        );


      } catch (error) {

        errorCount++;

        console.error(
          "Error processing deposit:",
          deposit?._id
        );

        console.error(
          error.message
        );
      }
    }


    // ========================================================
    // FINAL SUMMARY
    // ========================================================

    console.log(
      "=================================================="
    );

    console.log(
      "LOTTERY DEPOSIT SYNC COMPLETED"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "Total Deposits:",
      deposits.length
    );

    console.log(
      "New Objects Created:",
      createdCount
    );

    console.log(
      "Already Existing:",
      existingCount
    );

    console.log(
      "Amount Mismatch:",
      amountMismatchCount
    );

    console.log(
      "Config Not Found:",
      configNotFoundCount
    );

    console.log(
      "Invalid Deposits:",
      invalidDepositCount
    );

    console.log(
      "Errors:",
      errorCount
    );

    console.log(
      "=================================================="
    );


  } catch (error) {

    console.error(
      "LOTTERY DEPOSIT SYNC ERROR:"
    );

    console.error(
      error
    );
  }
};


module.exports =
  syncLotteryDeposits;