const { createPaymentRequest } = require("../services/gatewayService.js");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const QwackPayCallbackLog = require("../models/QwackPayCallbackLog");
const LotteryConfig = require("../models/LotteryConfig");
const Festival = require("../models/Festival");
const Amount = require("../models/amountModel");
const FestivalAmount = require("../models/festival_amountModel");
const {
  checkNumbersAvailability,
  reserveNumbersAtomically,
  rollbackBatchReservations,
  markNumbersAsSold,
} = require("../services/ticketAvailabilityService");
const {
  validateDailyLotteryForPurchase,
} = require("./lotteryConfigController");

// =====================================================
// STATUS CONSTANTS
// =====================================================

const STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  CANCELLED: 3,
};

// =====================================================
// GATEWAY CONFIG
// (URL + secret live in services/gatewayService.js, env: GATEWAY_URL, GATEWAY_SECRET_KEY)
// =====================================================

const GATEWAY_SECRET_KEY = process.env.GATEWAY_SECRET_KEY || "";

// =====================================================
// URL HELPERS
// =====================================================

const getFrontendUrl = () => {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
};

const getBackendUrl = () => {
  return (process.env.BACKEND_URL || "http://localhost:5000").replace(
    /\/+$/,
    ""
  );
};

const getReturnUrl = () => {
  return (
    process.env.GATEWAY_RETURN_URL || `${getFrontendUrl()}/payment-success`
  ).replace(/\/+$/, "");
};

const getCallbackUrl = () => {
  return (
    process.env.GATEWAY_CALLBACK_URL ||
    `${getBackendUrl()}/api/deposit/callback`
  ).replace(/\/+$/, "");
};

// =====================================================
// HELPER: USER ID
// =====================================================

const getUserIdFromRequest = (req) => {
  return req.user?.id || req.user?._id || req.user?.uuid || null;
};

// =====================================================
// HELPER: ENTRY DATE (YYYY-MM-DD)
// =====================================================

const getEntryDateString = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

// =====================================================
// CREATE DEPOSIT (WITH LOTTERY TICKET SUPPORT)
// =====================================================

const createDeposit = async (req, res) => {
  try {
    const {
      paymentMethod,
      channel,
      amount,
      utr,
      configId,
      lotteryNumbers,
    } = req.body || {};

    // =====================================================
    // AMOUNT VALIDATION
    // =====================================================

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const normalizedChannel = String(channel || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, "");

    // =====================================================
    // LOTTERY TICKET PURCHASE (GATEWAY)
    // =====================================================

    if (["qwackpay", "gateway"].includes(normalizedChannel)) {
      const finalPaymentMethod = "INR";
      const finalChannel = "gateway";
      const money = numericAmount;

      // =====================================================
      // VALIDATE LOTTERY NUMBERS IF PROVIDED
      // =====================================================

      let normalizedLotteryNumbers = [];
      let lotteryConfig = null;
      let isFestivalConfig = false;

      if (Array.isArray(lotteryNumbers) && lotteryNumbers.length > 0) {
        if (!configId || !mongoose.Types.ObjectId.isValid(configId)) {
          return res.status(400).json({
            success: false,
            message: "Valid configId is required for lottery purchase",
          });
        }

        const requestedLotteryType = String(
          req.body?.lotteryType || ""
        ).trim().toLowerCase();

        // lotteryConfig / isFestivalConfig are declared in the outer scope
        lotteryConfig = null;
        isFestivalConfig = false;

        if (requestedLotteryType === "festival") {
          lotteryConfig = await Festival.findById(configId);
          if (lotteryConfig) {
            isFestivalConfig = true;
          } else {
            return res.status(404).json({
              success: false,
              message: "Festival lottery configuration not found",
            });
          }
        } else if (requestedLotteryType === "daily") {
          const dailyCheck = await validateDailyLotteryForPurchase({
            configId,
            drawDate: req.body?.drawDate,
          });
          if (!dailyCheck.valid) {
            return res.status(dailyCheck.status || 400).json({
              success: false,
              message: dailyCheck.message,
            });
          }
          lotteryConfig = dailyCheck.config;
          isFestivalConfig = false;
        } else {
          // If drawDate is specified, it must be validated as daily lottery
          if (req.body?.drawDate) {
            const dailyCheck = await validateDailyLotteryForPurchase({
              configId,
              drawDate: req.body?.drawDate,
            });
            if (!dailyCheck.valid) {
              return res.status(dailyCheck.status || 400).json({
                success: false,
                message: dailyCheck.message,
              });
            }
            lotteryConfig = dailyCheck.config;
            isFestivalConfig = false;
          } else {
            const dailyExists = await LotteryConfig.findById(configId);
            if (dailyExists) {
              const dailyCheck = await validateDailyLotteryForPurchase({
                configId,
              });
              if (!dailyCheck.valid) {
                return res.status(dailyCheck.status || 400).json({
                  success: false,
                  message: dailyCheck.message,
                });
              }
              lotteryConfig = dailyCheck.config;
              isFestivalConfig = false;
            } else {
              lotteryConfig = await Festival.findById(configId);
              if (lotteryConfig) {
                isFestivalConfig = true;
              }
            }
          }
        }

        if (!lotteryConfig) {
          return res.status(404).json({
            success: false,
            message: "Lottery configuration not found",
          });
        }

        if (!lotteryConfig.isActive) {
          return res.status(400).json({
            success: false,
            message: "Lottery is not active",
          });
        }

        for (let i = 0; i < lotteryNumbers.length; i++) {
          const num = String(lotteryNumbers[i] || "").trim();

          // Exactly 8 alphanumeric characters
          // Allowed: A-Z, a-z, 0-9
          if (!/^[a-zA-Z0-9]{8}$/.test(num)) {
            return res.status(400).json({
              success: false,
              message:
                `Ticket ${i + 1}: number must be exactly 8 alphanumeric characters`,
            });
          }

          normalizedLotteryNumbers.push(num);
        }

        const uniqueNumbers = new Set(normalizedLotteryNumbers);

        if (uniqueNumbers.size !== normalizedLotteryNumbers.length) {
          return res.status(400).json({
            success: false,
            message: "Duplicate numbers in the same purchase are not allowed",
          });
        }

        // Validate quantity relationship: quantity must equal lotteryNumbers.length * 10
        if (req.body?.quantity !== undefined && req.body?.quantity !== null) {
          const reqQty = Number(req.body.quantity);
          const expectedInputsCount = Math.floor(reqQty / 10);
          if (
            !Number.isFinite(reqQty) ||
            reqQty % 10 !== 0 ||
            reqQty <= 0 ||
            normalizedLotteryNumbers.length !== expectedInputsCount
          ) {
            return res.status(400).json({
              success: false,
              message: `Quantity mismatch: ${reqQty} tickets require exactly ${expectedInputsCount} ticket number(s), but received ${normalizedLotteryNumbers.length}`,
            });
          }
        }

        // Validate amount
        let setPrice = Number(lotteryConfig.ticketPrice || lotteryConfig.price) || 0;
        if (!setPrice || setPrice <= 0) {
          if (isFestivalConfig) {
            const festDoc = await FestivalAmount.findOne();
            setPrice = Number(festDoc?.amount) || 270;
          } else {
            const dailyDoc = await Amount.findOne();
            setPrice = Number(dailyDoc?.amount) || 250;
          }
        }

        if (setPrice > 0) {
          const expectedAmount = setPrice * normalizedLotteryNumbers.length;
          if (Math.abs(money - expectedAmount) > 1) {
            return res.status(400).json({
              success: false,
              message: `Amount mismatch. Expected ₹${expectedAmount} for ${normalizedLotteryNumbers.length * 10} tickets (${normalizedLotteryNumbers.length} ticket number(s))`,
            });
          }
        }

        // =====================================================
        // CHECK AVAILABILITY AGAINST CRON-SOLD & EXISTING ENTRIES
        // =====================================================
        const availabilityCheck = await checkNumbersAvailability(
          normalizedLotteryNumbers,
          { configId: lotteryConfig._id, userId: user._id }
        );

        if (!availabilityCheck.available) {
          return res.status(400).json({
            success: false,
            message: availabilityCheck.reason,
            unavailableNumbers: availabilityCheck.unavailableNumbers,
          });
        }

        // =====================================================
        // ATOMICALLY RESERVE NUMBERS IN LOTTERYNUMBER
        // Prevents simultaneous CRON or concurrent purchases
        // =====================================================
        const reservation = await reserveNumbersAtomically(normalizedLotteryNumbers);

        if (!reservation.success) {
          return res.status(400).json({
            success: false,
            message: reservation.message,
            conflictNumber: reservation.conflictNumber,
          });
        }
      }

      const orderId = `DEP${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const resolvedLotteryType =
        normalizedLotteryNumbers.length > 0
          ? isFestivalConfig
            ? "festival"
            : "daily"
          : "";
      const resolvedMarketName =
        normalizedLotteryNumbers.length > 0 && lotteryConfig
          ? lotteryConfig.marketName ||
            (isFestivalConfig ? "Festival Lottery" : "Daily Lottery")
          : "";

      const deposit = await Deposit.create({
        userId: user._id,
        gatewayId: null,
        uid: user.uuid,
        phone: user.mobile,
        username: user.username,
        orderId,
        paymentMethod: finalPaymentMethod,
        type: finalPaymentMethod,
        channel: finalChannel,
        amount: money,
        exchangeRate: 0,
        transactionId: orderId,
        utr: "",
        paymentProof: "",
        paymentUrl: "",
        status: STATUS.PENDING,

        configId: lotteryConfig ? lotteryConfig._id : (configId || null),
        lotteryType: resolvedLotteryType,
        marketName: resolvedMarketName,
        lotteryNumbers: normalizedLotteryNumbers,
        quantity: normalizedLotteryNumbers.length > 0 ? normalizedLotteryNumbers.length * 10 : 10,
        number:
          normalizedLotteryNumbers.length === 1
            ? normalizedLotteryNumbers[0]
            : null,
      });

      const customerName =
        String(user.username || user.name || "").trim() || "Customer";
      const customerPhone = String(user.mobile || "").trim();
      const callbackUrl = getCallbackUrl();
      const returnUrl = `${getReturnUrl()}?order_id=${encodeURIComponent(
        orderId
      )}`;

      console.log("=================================================");
      console.log("GATEWAY CREATE REQUEST");
      console.log({
        amount: Math.round(numericAmount),
        orderId,
        customerName,
        customerPhone,
        callbackUrl,
        returnUrl,
        lotteryNumbers: normalizedLotteryNumbers,
      });
      console.log("=================================================");

      try {
        const gatewayResponse = await createPaymentRequest({
          amount: Math.round(numericAmount),
          orderId,
          customerName,
          customerPhone,
          callbackUrl,
          returnUrl,
        });

        console.log("=================================================");
        console.log("GATEWAY CREATE RESPONSE:");
        console.log(JSON.stringify(gatewayResponse, null, 2));
        console.log("=================================================");

        const paymentUrl =
          gatewayResponse?.data?.paymentUrl ||
          gatewayResponse?.data?.payment_url ||
          gatewayResponse?.data?.url ||
          gatewayResponse?.paymentUrl ||
          gatewayResponse?.payment_url ||
          gatewayResponse?.url ||
          "";

        // We send our own orderId to the gateway, so keep it as the order id
        const returnedOrderId = orderId;

        const gatewayTxnId =
          gatewayResponse?.data?.transactionId ||
          gatewayResponse?.data?.transaction_id ||
          gatewayResponse?.data?.paymentId ||
          gatewayResponse?.transactionId ||
          gatewayResponse?.transaction_id ||
          gatewayResponse?.paymentId ||
          "";

        const gatewayCode =
          gatewayResponse?.status ?? gatewayResponse?.code ?? "unknown";

        if (paymentUrl) {
          deposit.paymentUrl = String(paymentUrl);
          deposit.orderId = String(returnedOrderId);
          deposit.transactionId = String(
            gatewayTxnId || returnedOrderId || orderId
          );
          deposit.status = STATUS.PENDING;

          await deposit.save();

          await TransactionHistory.create({
            orderId: deposit.orderId,
            userId: user._id,
            uid: user.uuid,
            phone: user.mobile,
            type: "Deposit",
            amount: money,
            status: STATUS.PENDING,
            remark: normalizedLotteryNumbers.length
              ? `Pending gateway recharge for ${normalizedLotteryNumbers.length} lottery ticket(s)`
              : "Pending gateway recharge",
          });

          return res.status(201).json({
            success: true,
            message: normalizedLotteryNumbers.length
              ? `Payment order created for ${normalizedLotteryNumbers.length} ticket(s).`
              : "Recharge order created successfully.",
            paymentUrl: String(paymentUrl),
            successUrl: getReturnUrl(),
            callbackUrl: getCallbackUrl(),
            orderId: deposit.orderId,
            depositId: deposit._id,
            amount: money,
            status: "pending",
            lotteryType: deposit.lotteryType || (isFestivalConfig ? "festival" : "daily"),
            marketName: deposit.marketName || (lotteryConfig?.marketName || ""),
            lotteryNumbers: normalizedLotteryNumbers,
            deposit,
            gatewayResponse,
          });
        }

        if (normalizedLotteryNumbers.length > 0) {
          await rollbackBatchReservations(normalizedLotteryNumbers);
        }

        deposit.status = STATUS.FAILED;
        await deposit.save();

        return res.status(400).json({
          success: false,
          message:
            gatewayResponse?.error ||
            gatewayResponse?.message ||
            gatewayResponse?.data?.message ||
            `Payment URL not received. Gateway code: ${gatewayCode}`,
          paymentUrl: "",
          orderId: deposit.orderId,
          gatewayResponse,
        });
      } catch (gatewayErr) {
        console.error("=================================================");
        console.error("GATEWAY CREATE ERROR:");
        console.error(gatewayErr.response?.data || gatewayErr.message);
        console.error("=================================================");

        if (normalizedLotteryNumbers.length > 0) {
          await rollbackBatchReservations(normalizedLotteryNumbers);
        }

        deposit.status = STATUS.FAILED;
        await deposit.save();

        return res.status(502).json({
          success: false,
          message: "Payment request failed.",
          paymentUrl: "",
          orderId: deposit.orderId,
          error: gatewayErr.response?.data || gatewayErr.message,
        });
      }
    }

    // =====================================================
    // MANUAL FLOW (non-qwackpay)
    // =====================================================

    if (!paymentMethod || !channel) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod and channel are required",
      });
    }

    const usdRet = 92;
    const finalPaymentMethod = paymentMethod;
    const finalChannel = channel;

    const money =
      String(finalPaymentMethod).toUpperCase() === "INR"
        ? numericAmount
        : numericAmount * usdRet;

    const orderId = `DEP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    let imageUrl = "";

    if (req.files && req.files.image && req.files.image[0]) {
      imageUrl = req.files.image[0].path || "";
    }

    const deposit = await Deposit.create({
      userId: user._id,
      gatewayId: null,
      uid: user.uuid,
      phone: user.mobile,
      username: user.username,
      orderId,
      paymentMethod: finalPaymentMethod,
      type: finalPaymentMethod,
      channel: finalChannel,
      amount: money,
      exchangeRate:
        String(finalPaymentMethod).toUpperCase() === "USDT" ? usdRet : 0,
      transactionId: orderId,
      utr: utr || "",
      paymentProof: imageUrl,
      paymentUrl: "",
      status: STATUS.PENDING,
      configId: configId || null,
    });

    await TransactionHistory.create({
      orderId,
      userId: user._id,
      uid: user.uuid,
      phone: user.mobile,
      type: "Deposit",
      amount: money,
      status: STATUS.PENDING,
      remark: `Recharge request submitted via ${finalChannel}`,
    });

    return res.status(201).json({
      success: true,
      message: "Recharge request submitted successfully.",
      paymentUrl: "",
      orderId,
      depositId: deposit._id,
      deposit,
    });
  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// PROCESS LOTTERY ENTRIES ON SUCCESS
// Adds entries into LotteryConfig.users[] array
// =====================================================

const processLotteryEntries = async (deposit, user, session = null) => {
  // Skip if already processed
  if (deposit.lotteryProcessed) {
    console.log("LOTTERY ALREADY PROCESSED FOR DEPOSIT:", deposit._id);
    return { processed: false, reason: "already_processed" };
  }

  // Skip if no lottery numbers
  if (
    !Array.isArray(deposit.lotteryNumbers) ||
    deposit.lotteryNumbers.length === 0
  ) {
    console.log("NO LOTTERY NUMBERS IN DEPOSIT:", deposit._id);
    return { processed: false, reason: "no_lottery_numbers" };
  }

  // Skip if no configId
  if (!deposit.configId) {
    console.log("NO CONFIG ID IN DEPOSIT:", deposit._id);
    return { processed: false, reason: "no_config_id" };
  }

  try {
    // Verify lottery config exists and is still active
    let lotteryConfig = await LotteryConfig.findById(
      deposit.configId
    ).session(session);
    let ConfigModel = LotteryConfig;

    if (!lotteryConfig) {
      lotteryConfig = await Festival.findById(
        deposit.configId
      ).session(session);
      if (lotteryConfig) {
        ConfigModel = Festival;
      }
    }

    if (!lotteryConfig) {
      console.error("LOTTERY CONFIG NOT FOUND:", deposit.configId);
      return { processed: false, reason: "config_not_found" };
    }

    if (!lotteryConfig.isActive) {
      console.error("LOTTERY CONFIG NOT ACTIVE:", deposit.configId);
      return { processed: false, reason: "config_not_active" };
    }

    // =====================================================
    // TICKET PRICE (config ya deposit se fallback)
    // =====================================================

    let ticketPrice = Number(lotteryConfig.ticketPrice || lotteryConfig.price) || 0;

    if (!ticketPrice || ticketPrice <= 0) {
      const totalNumbers = deposit.lotteryNumbers.length || 1;
      const depositAmount = Number(deposit.amount) || 0;
      ticketPrice =
        depositAmount > 0
          ? Number((depositAmount / totalNumbers).toFixed(2))
          : 0;
    }

    // =====================================================
    // ENTRY DATE (YYYY-MM-DD)
    // =====================================================

    const entryDate = getEntryDateString(
      deposit.lotteryProcessedAt || new Date()
    );

    // =====================================================
    // BUILD NEW ENTRIES (skip duplicates)
    // =====================================================

    const existingNumbers = new Set(
      (lotteryConfig.users || [])
        .filter(
          (u) =>
            String(u.userId) === String(user._id) &&
            u.entryDate === entryDate
        )
        .map((u) => String(u.number))
    );

    const newEntries = [];
    let skippedCount = 0;

    for (const num of deposit.lotteryNumbers) {
      const numberStr = String(num);

      if (existingNumbers.has(numberStr)) {
        console.log(
          `LOTTERY ENTRY ALREADY EXISTS: user=${user._id} number=${numberStr}`
        );
        skippedCount++;
        continue;
      }

      newEntries.push({
        userId: String(user._id),
        entryDate,
        number: numberStr,
        amount: ticketPrice,
        quantity: 10,
        isBuy: true,
        prize: { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 },
        prizeType: null,
        status: "pending",
      });

      existingNumbers.add(numberStr);
    }

    // =====================================================
    // PUSH ENTRIES INTO CONFIG.USERS[]
    // =====================================================

    if (newEntries.length > 0) {
      await ConfigModel.findByIdAndUpdate(
        deposit.configId,
        {
          $push: {
            users: { $each: newEntries },
          },
        },
        { session, new: true }
      );

      // Permanently mark numbers as sold in LotteryNumber collection
      await markNumbersAsSold(deposit.lotteryNumbers, entryDate);
    }

    // Mark deposit as lottery processed
    await Deposit.findByIdAndUpdate(
      deposit._id,
      {
        $set: {
          lotteryProcessed: true,
          lotteryProcessedAt: new Date(),
          lotteryType: ConfigModel === Festival ? "festival" : "daily",
          marketName: lotteryConfig.marketName || (ConfigModel === Festival ? "Festival Lottery" : "Daily Lottery"),
        },
      },
      { session }
    );

    console.log("=================================================");
    console.log("LOTTERY ENTRIES ADDED TO CONFIG.USERS[]");
    console.log("DEPOSIT:", deposit._id);
    console.log("CONFIG:", deposit.configId);
    console.log("ENTRY DATE:", entryDate);
    console.log("TICKET PRICE:", ticketPrice);
    console.log("ENTRIES ADDED:", newEntries.length);
    console.log("ENTRIES SKIPPED:", skippedCount);
    console.log("=================================================");

    return {
      processed: true,
      createdCount: newEntries.length,
      skippedCount,
      entries: newEntries,
    };
  } catch (error) {
    console.error("PROCESS LOTTERY ENTRIES ERROR:", error);
    throw error;
  }
};

// =====================================================
// CANCEL DEPOSIT
// =====================================================

const cancelDeposit = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { depositId } = req.params;
    const { reason = "User cancelled at gateway" } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!depositId) {
      return res.status(400).json({
        success: false,
        message: "Deposit ID is required",
      });
    }

    const query = mongoose.Types.ObjectId.isValid(depositId)
      ? { _id: depositId, userId }
      : { orderId: String(depositId), userId };

    const deposit = await Deposit.findOne(query);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    if (Number(deposit.status) === STATUS.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: "Deposit already successful, cannot cancel",
        status: deposit.status,
      });
    }

    if (Number(deposit.status) === STATUS.CANCELLED) {
      return res.status(200).json({
        success: true,
        message: "Deposit already cancelled",
        depositId: deposit._id,
        orderId: deposit.orderId,
        status: STATUS.CANCELLED,
        cancelledAt: deposit.cancelledAt,
      });
    }

    deposit.status = STATUS.CANCELLED;
    deposit.cancelReason = String(reason);
    deposit.cancelledAt = new Date();
    deposit.cancelledBy = "USER";

    await deposit.save();

    try {
      await TransactionHistory.updateOne(
        {
          orderId: deposit.orderId,
          userId: deposit.userId,
          type: "Deposit",
          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.CANCELLED,
            remark: `User cancelled payment. Reason: ${reason}`,
            updatedAt: new Date(),
          },
        }
      );
    } catch (historyError) {
      console.warn(
        "TransactionHistory update failed:",
        historyError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Deposit cancelled",
      depositId: deposit._id,
      orderId: deposit.orderId,
      status: STATUS.CANCELLED,
      cancelledAt: deposit.cancelledAt,
    });
  } catch (error) {
    console.error("CANCEL DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// GET DEPOSIT STATUS
// =====================================================

const getDepositStatusByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    console.log("=================================");
    console.log("STATUS CHECK");
    console.log("identifier:", identifier);

    const safeIdentifier = String(identifier || "").trim();

    if (!safeIdentifier) {
      return res.status(400).json({
        success: false,
        message: "Deposit identifier is required",
      });
    }

    const deposit = await Deposit.findOne({
      $or: [
        { orderId: safeIdentifier },
        ...(mongoose.Types.ObjectId.isValid(safeIdentifier)
          ? [{ _id: safeIdentifier }]
          : []),
      ],
    }).lean();

    console.log("FOUND DEPOSIT:", deposit);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // =====================================================
    // FETCH LOTTERY ENTRIES FROM CONFIG.USERS[]
    // =====================================================

    let lotteryEntries = [];

    if (
      Number(deposit.status) === STATUS.SUCCESS &&
      deposit.configId &&
      Array.isArray(deposit.lotteryNumbers) &&
      deposit.lotteryNumbers.length > 0
    ) {
      let config = await LotteryConfig.findById(deposit.configId).lean();
      if (!config) {
        config = await Festival.findById(deposit.configId).lean();
      }

      if (config && Array.isArray(config.users)) {
        const wantedNumbers = new Set(
          deposit.lotteryNumbers.map((n) => String(n))
        );

        lotteryEntries = config.users.filter(
          (u) =>
            String(u.userId) === String(deposit.userId) &&
            wantedNumbers.has(String(u.number))
        );
      }
    }

    return res.status(200).json({
      success: true,
      deposit: {
        _id: deposit._id,
        orderId: deposit.orderId,
        amount: deposit.amount,
        status: Number(deposit.status),
        paymentMethod: deposit.paymentMethod || "",
        channel: deposit.channel || "",
        transactionId: deposit.transactionId || "",
        utr: deposit.utr || "",
        cancelReason: deposit.cancelReason || "",
        cancelledAt: deposit.cancelledAt || null,
        createdAt: deposit.createdAt,

        // Lottery info
        configId: deposit.configId || null,
        lotteryNumbers: deposit.lotteryNumbers || [],
        lotteryProcessed: deposit.lotteryProcessed || false,
        lotteryProcessedAt: deposit.lotteryProcessedAt || null,
        lotteryEntries: lotteryEntries.map((e) => ({
          _id: e._id,
          number: e.number,
          amount: e.amount,
          status: e.status,
          prizeType: e.prizeType || null,
          prize: e.prize || { first: 0, second: 0, third: 0 },
          isBuy: e.isBuy || false,
          entryDate: e.entryDate,
          createdAt: e.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET DEPOSIT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// GATEWAY WEBHOOK HELPERS
// =====================================================

const GATEWAY_SUCCESS_STATUSES = [
  "success",
  "successful",
  "paid",
  "completed",
  "complete",
  "approved",
  "1",
];

const GATEWAY_FAILED_STATUSES = [
  "failed",
  "failure",
  "declined",
  "rejected",
  "cancelled",
  "canceled",
  "2",
  "3",
];

const getCallbackValue = (body = {}, query = {}, keys = []) => {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
      return body[key];
    }

    if (query[key] !== undefined && query[key] !== null && query[key] !== "") {
      return query[key];
    }
  }

  return "";
};

const sanitizeCallbackHeaders = (headers = {}) => {
  const safeHeaders = {};

  Object.entries(headers || {}).forEach(([key, value]) => {
    const lowerKey = String(key).toLowerCase();

    if (
      lowerKey === "authorization" ||
      lowerKey === "cookie" ||
      lowerKey === "set-cookie" ||
      lowerKey === "x-api-key" ||
      lowerKey === "x-secret-key" ||
      lowerKey === "x-signature"
    ) {
      safeHeaders[key] = "***MASKED***";
      return;
    }

    safeHeaders[key] = value;
  });

  return safeHeaders;
};

const getCallbackIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];

  return (
    req.headers?.["cf-connecting-ip"] ||
    (forwarded ? String(forwarded).split(",")[0].trim() : "") ||
    req.headers?.["x-real-ip"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    ""
  );
};

/**
 * Verify webhook signature (HMAC-SHA256 of JSON body, header: x-signature)
 * - Header present  -> must match, otherwise rejected
 * - Header missing  -> allowed only outside production (dev mode)
 */
const verifyWebhookSignature = (req) => {
  const signature = req.headers?.["x-signature"];
  const isProduction = process.env.NODE_ENV === "production";

  if (!signature) {
    return !isProduction;
  }

  if (!GATEWAY_SECRET_KEY) {
    console.error("GATEWAY_SECRET_KEY is not configured");
    return false;
  }

  try {
    const body = JSON.stringify(req.body);
    const expected = crypto
      .createHmac("sha256", GATEWAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(String(signature)),
      Buffer.from(expected)
    );
  } catch (err) {
    console.error("Signature verification error:", err.message);
    return false;
  }
};

// =====================================================
// GATEWAY WEBHOOK / CALLBACK
// POST /api/deposit/callback
// Payload: { event, status, orderId, amount, utr }
// WALLET CREDIT DISABLED — amount only saved in Deposit
// Lottery entries pushed into LotteryConfig.users[]
// =====================================================

const onlinePayCallback = async (req, res) => {
  console.log(
    `[GATEWAY CALLBACK HIT] ${new Date().toISOString()} method=${req.method} url=${req.originalUrl || req.url}`
  );

  let callbackLog = null;

  const setCallbackLog = async (values) => {
    if (!callbackLog?._id) return;
    try {
      await QwackPayCallbackLog.findByIdAndUpdate(callbackLog._id, {
        $set: values,
      });
    } catch (logError) {
      console.error("CALLBACK LOG UPDATE ERROR:", logError.message);
    }
  };

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const query = req.query && typeof req.query === "object" ? req.query : {};

  console.log("=================================================");
  console.log("GATEWAY CALLBACK RECEIVED");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl || req.url || "");
  console.log("IP:", getCallbackIp(req));
  console.log("BODY:", JSON.stringify(body, null, 2));
  console.log("QUERY:", JSON.stringify(query, null, 2));
  console.log("=================================================");

  const orderId = String(
    getCallbackValue(body, query, ["orderId", "order_id", "merchant_order_id"]) ||
      ""
  ).trim();

  const gatewayTxnId = String(
    getCallbackValue(body, query, [
      "transactionId",
      "transaction_id",
      "paymentId",
      "payment_id",
    ]) || ""
  ).trim();

  const event = String(getCallbackValue(body, query, ["event"]) || "")
    .trim()
    .toLowerCase();

  const gatewayStatus = String(
    getCallbackValue(body, query, ["status", "payment_status"]) || ""
  )
    .trim()
    .toLowerCase();

  const amountRaw = getCallbackValue(body, query, ["amount", "paid_amount"]);
  const callbackAmount = Number(amountRaw);

  const utr = String(
    getCallbackValue(body, query, ["utr", "utr_number", "rrn"]) || ""
  ).trim();

  const receivedSign = String(req.headers?.["x-signature"] || "").trim();

  // =====================================================
  // LOG CREATION (isolated try/catch)
  // =====================================================

  try {
    callbackLog = await QwackPayCallbackLog.create({
      merchantOrderId: orderId,
      qwackOrderId: gatewayTxnId,
      amount: Number.isFinite(callbackAmount) ? callbackAmount : 0,
      gatewayStatus: event || gatewayStatus,
      utr,
      sign: receivedSign,
      signValid: false,
      method: req.method || "",
      url: req.originalUrl || req.url || "",
      ip: getCallbackIp(req),
      headers: sanitizeCallbackHeaders(req.headers),
      body,
      query,
      event: "RECEIVED",
      processingStatus: "RECEIVED",
      message: "Gateway callback received",
    });
  } catch (logCreateError) {
    console.error(
      "CALLBACK LOG CREATE ERROR (continuing without log):",
      logCreateError.message
    );
    callbackLog = null;
  }

  try {
    // =====================================================
    // 1. VERIFY SIGNATURE
    // =====================================================

    if (!verifyWebhookSignature(req)) {
      console.warn("⚠️ Invalid webhook signature");

      await setCallbackLog({
        signValid: false,
        event: "SIGN_INVALID",
        processingStatus: "FAILED",
        message: "Invalid webhook signature",
        processedAt: new Date(),
      });

      return res
        .status(401)
        .json({ status: "error", message: "Invalid signature" });
    }

    await setCallbackLog({ signValid: true, event: "SIGN_VALID" });

    // =====================================================
    // 2. ORDER ID REQUIRED
    // =====================================================

    if (!orderId && !gatewayTxnId) {
      await setCallbackLog({
        event: "NO_ORDER_ID",
        processingStatus: "FAILED",
        message: "Missing orderId in webhook payload",
        processedAt: new Date(),
      });

      return res.status(400).json({
        status: "error",
        message: "Missing orderId in webhook payload",
      });
    }

    // =====================================================
    // 3. FIND DEPOSIT
    // =====================================================

    const orderConditions = [];
    if (orderId) orderConditions.push({ orderId });
    if (gatewayTxnId) orderConditions.push({ transactionId: gatewayTxnId });

    const deposit = await Deposit.findOne({ $or: orderConditions });

    if (!deposit) {
      console.warn(`⚠️ Webhook for unknown order: ${orderId}`);

      await setCallbackLog({
        event: "DEPOSIT_NOT_FOUND",
        processingStatus: "FAILED",
        message: `Deposit not found for orderId=${orderId}`,
        processedAt: new Date(),
      });

      // ACK anyway to stop retries
      return res.status(200).json({ status: "ok" });
    }

    await setCallbackLog({ depositId: deposit._id });

    // =====================================================
    // 4. IDEMPOTENCY / TERMINAL STATES
    // =====================================================

    if (Number(deposit.status) === STATUS.SUCCESS) {
      // Already processed - but check if lottery needs processing
      if (
        !deposit.lotteryProcessed &&
        deposit.lotteryNumbers &&
        deposit.lotteryNumbers.length > 0
      ) {
        try {
          const user = await User.findById(deposit.userId);

          if (user) {
            await processLotteryEntries(deposit, user, null);
          }
        } catch (lotteryError) {
          console.error("LATE LOTTERY PROCESSING ERROR:", lotteryError.message);
        }
      }

      await setCallbackLog({
        event: "ALREADY_PROCESSED",
        processingStatus: "SUCCESS",
        message: "Payment already processed",
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    if (Number(deposit.status) === STATUS.CANCELLED) {
      await setCallbackLog({
        event: "CANCELLED_DEPOSIT",
        processingStatus: "SUCCESS",
        message: "Deposit was already cancelled",
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    // =====================================================
    // 5. DECIDE OUTCOME (event first, then status)
    // =====================================================

    const isApproved =
      event === "payment.approved" ||
      (!event && GATEWAY_SUCCESS_STATUSES.includes(gatewayStatus));

    const isFailed =
      event === "payment.failed" ||
      (!event && GATEWAY_FAILED_STATUSES.includes(gatewayStatus));

    const finalUtr = utr || deposit.utr || "";
    const finalTransactionId = gatewayTxnId || finalUtr || deposit.transactionId;

    // =====================================================
    // 6. FAILED
    // =====================================================

    if (isFailed) {
      console.log(`❌ Order ${deposit.orderId} FAILED`);

      await Deposit.findOneAndUpdate(
        { _id: deposit._id, status: STATUS.PENDING },
        {
          $set: {
            status: STATUS.FAILED,
            utr: finalUtr,
            transactionId: finalTransactionId,
          },
        }
      );

      await TransactionHistory.findOneAndUpdate(
        {
          orderId: String(deposit.orderId),
          userId: deposit.userId,
          type: "Deposit",
          status: STATUS.PENDING,
        },
        {
          $set: {
            status: STATUS.FAILED,
            amount: Number(deposit.amount),
            remark: `Payment failed. Event: ${event || gatewayStatus}`,
            updatedAt: new Date(),
          },
        },
        { sort: { createdAt: -1 } }
      );

      await setCallbackLog({
        event: "PAYMENT_FAILED",
        processingStatus: "SUCCESS",
        message: `Payment failure: ${event || gatewayStatus}`,
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    // =====================================================
    // 7. PENDING / UNHANDLED EVENT
    // =====================================================

    if (!isApproved) {
      console.log(
        `ℹ️ Unhandled event: ${event || "-"} status: ${gatewayStatus || "-"} for order ${deposit.orderId}`
      );

      await setCallbackLog({
        event: "PAYMENT_PENDING",
        processingStatus: "SUCCESS",
        message: `Unhandled/pending callback. event=${event || "none"} status=${gatewayStatus || "none"}`,
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    // =====================================================
    // 8. APPROVED — VALIDATE AMOUNT
    // =====================================================

    const depositAmount = Number(deposit.amount);

    // If gateway sent an amount it must match; if not sent, use deposit amount
    const hasCallbackAmount = Number.isFinite(callbackAmount) && callbackAmount > 0;
    const finalAmount = hasCallbackAmount ? callbackAmount : depositAmount;

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      await setCallbackLog({
        event: "INVALID_AMOUNT",
        processingStatus: "FAILED",
        message: `Invalid amount: ${finalAmount}`,
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    if (
      hasCallbackAmount &&
      Number.isFinite(depositAmount) &&
      Math.abs(finalAmount - depositAmount) > 0.01
    ) {
      await setCallbackLog({
        event: "AMOUNT_MISMATCH",
        processingStatus: "FAILED",
        message: `Amount mismatch. Deposit=${depositAmount}, Gateway=${finalAmount}`,
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    const user = await User.findById(deposit.userId);

    if (!user) {
      await setCallbackLog({
        event: "USER_NOT_FOUND",
        processingStatus: "FAILED",
        message: "User not found",
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    // =====================================================
    // 9. ATOMIC DEPOSIT + LOTTERY TRANSACTION
    // ⚠️ WALLET CREDIT DISABLED
    // =====================================================

    console.log(`✅ Order ${deposit.orderId} APPROVED — UTR: ${finalUtr}`);

    const session = await mongoose.startSession();

    let transactionCommitted = false;
    let updatedWallet = null;
    let lotteryResult = null;

    try {
      await session.withTransaction(async () => {
        const freshDeposit = await Deposit.findOne({
          _id: deposit._id,
          status: STATUS.PENDING,
        }).session(session);

        if (!freshDeposit) {
          return;
        }

        const freshUser = await User.findById(deposit.userId).session(session);

        if (!freshUser) {
          throw new Error("User not found while processing payment");
        }

        // ❌ WALLET CREDIT DISABLED
        // User wallet is NOT updated. Amount only saved in Deposit.
        updatedWallet = freshUser.wallet;

        // UPDATE DEPOSIT → SUCCESS
        const depositUpdate = await Deposit.findOneAndUpdate(
          {
            _id: freshDeposit._id,
            status: STATUS.PENDING,
          },
          {
            $set: {
              status: STATUS.SUCCESS,
              utr: finalUtr,
              transactionId: finalTransactionId || freshDeposit.transactionId,
            },
          },
          { new: true, session }
        );

        if (!depositUpdate) {
          throw new Error("Deposit could not be claimed");
        }

        // UPDATE TRANSACTION HISTORY
        const successRemark = freshDeposit.lotteryNumbers?.length
          ? `Lottery purchase successful. UTR: ${finalUtr || "N/A"}. ${freshDeposit.lotteryNumbers.length} ticket(s) added. Amount: ₹${finalAmount}`
          : `Payment successful. UTR: ${finalUtr || "N/A"}. Amount: ₹${finalAmount}`;

        const historyUpdate = await TransactionHistory.findOneAndUpdate(
          {
            orderId: String(freshDeposit.orderId),
            userId: freshUser._id,
            type: "Deposit",
            status: STATUS.PENDING,
          },
          {
            $set: {
              status: STATUS.SUCCESS,
              amount: finalAmount,
              uid: freshUser.uuid,
              phone: freshUser.mobile,
              remark: successRemark,
              updatedAt: new Date(),
            },
          },
          { new: true, sort: { createdAt: -1 }, session }
        );

        if (!historyUpdate) {
          await TransactionHistory.create(
            [
              {
                orderId: String(freshDeposit.orderId),
                userId: freshUser._id,
                uid: freshUser.uuid,
                phone: freshUser.mobile,
                type: "Deposit",
                amount: finalAmount,
                status: STATUS.SUCCESS,
                remark: successRemark,
              },
            ],
            { session }
          );
        }

        // PROCESS LOTTERY ENTRIES (push into LotteryConfig.users[])
        if (
          freshDeposit.lotteryNumbers &&
          freshDeposit.lotteryNumbers.length > 0 &&
          freshDeposit.configId &&
          !freshDeposit.lotteryProcessed
        ) {
          lotteryResult = await processLotteryEntries(
            depositUpdate,
            freshUser,
            session
          );
        }

        transactionCommitted = true;
      });
    } finally {
      await session.endSession();
    }

    if (!transactionCommitted) {
      await setCallbackLog({
        event: "ALREADY_PROCESSED",
        processingStatus: "SUCCESS",
        message: "Payment was already processed by another callback",
        processedAt: new Date(),
      });

      return res.status(200).json({ status: "ok" });
    }

    await setCallbackLog({
      event: "PAYMENT_SUCCESS",
      processingStatus: "SUCCESS",
      signValid: true,
      message: `₹${finalAmount} processed (wallet unchanged). Lottery entries: ${lotteryResult?.createdCount || 0} added.`,
      processedAt: new Date(),
    });

    console.log("=================================================");
    console.log("GATEWAY CALLBACK SUCCESS");
    console.log("ORDER:", deposit.orderId);
    console.log("GATEWAY TXN:", gatewayTxnId);
    console.log("AMOUNT:", finalAmount);
    console.log("UTR:", finalUtr);
    console.log("USER:", user._id.toString());
    console.log("WALLET:", updatedWallet, "(unchanged)");
    console.log(
      "LOTTERY ENTRIES:",
      lotteryResult?.createdCount || 0,
      "added,",
      lotteryResult?.skippedCount || 0,
      "skipped"
    );
    console.log("=================================================");

    // ACK to gateway (CRITICAL — stops retries)
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Webhook Error:", error.response?.data || error.message);

    await setCallbackLog({
      event: "EXCEPTION",
      processingStatus: "FAILED",
      message: "Callback processing exception",
      error: error.message,
      processedAt: new Date(),
    });

    // 500 → gateway will retry
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// =====================================================
// GET MY DEPOSITS
// =====================================================

const getMyDeposits = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      channel,
      phone,
      username,
      orderId,
      transactionId,
      utr,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sort = "desc",
    } = req.query;

    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const query = { userId };

    if (status !== undefined && status !== "") {
      const statusNumber = Number(status);
      if (Number.isInteger(statusNumber)) {
        query.status = statusNumber;
      }
    }

    if (paymentMethod && paymentMethod.trim()) {
      query.paymentMethod = {
        $regex: paymentMethod.trim(),
        $options: "i",
      };
    }

    if (channel && channel.trim()) {
      query.channel = { $regex: channel.trim(), $options: "i" };
    }

    if (phone && phone.trim()) {
      query.phone = { $regex: phone.trim(), $options: "i" };
    }

    if (username && username.trim()) {
      query.username = { $regex: username.trim(), $options: "i" };
    }

    if (orderId && orderId.trim()) {
      query.orderId = { $regex: orderId.trim(), $options: "i" };
    }

    if (transactionId && transactionId.trim()) {
      query.transactionId = {
        $regex: transactionId.trim(),
        $options: "i",
      };
    }

    if (utr && utr.trim()) {
      query.utr = { $regex: utr.trim(), $options: "i" };
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      const amountQuery = {};

      if (minAmount !== undefined && minAmount !== "") {
        const min = Number(minAmount);
        if (Number.isFinite(min)) {
          amountQuery.$gte = min;
        }
      }

      if (maxAmount !== undefined && maxAmount !== "") {
        const max = Number(maxAmount);
        if (Number.isFinite(max)) {
          amountQuery.$lte = max;
        }
      }

      if (Object.keys(amountQuery).length > 0) {
        query.amount = amountQuery;
      }
    }

    if (fromDate || toDate) {
      const dateQuery = {};

      if (fromDate) {
        const startDate = new Date(fromDate);
        if (!Number.isNaN(startDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          dateQuery.$gte = startDate;
        }
      }

      if (toDate) {
        const endDate = new Date(toDate);
        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDate;
        }
      }

      if (Object.keys(dateQuery).length > 0) {
        query.createdAt = dateQuery;
      }
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const total = await Deposit.countDocuments(query);

    const sortDirection = String(sort).toLowerCase() === "asc" ? 1 : -1;

    const deposits = await Deposit.find(query)
      .sort({ createdAt: sortDirection })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .lean();

    return res.status(200).json({
      success: true,
      total,
      currentPage,
      totalPages: Math.ceil(total / perPage),
      limit: perPage,
      deposits,
    });
  } catch (error) {
    console.error("GET MY DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY TURNOVER HISTORY
// =====================================================

const getMyTurnoverHistory = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const downlineCount = await User.countDocuments({
      referral: user.refCode,
    });

    const commissions = await TransactionHistory.find({
      userId: userId.toString(),
      type: "Referral Bonus",
      status: STATUS.SUCCESS,
    }).sort({ createdAt: -1 });

    const formattedCommissions = commissions.map((commission) => {
      const match = commission.remark
        ? commission.remark.match(/from deposit of (.+)/)
        : null;

      const referredUsername = match ? match[1] : "Referred User";

      const rechargeAmount = Number(
        (Number(commission.amount || 0) * 10).toFixed(2)
      );

      return {
        id: commission._id,
        amount: commission.amount,
        rechargeAmount,
        referredUsername,
        date: commission.createdAt
          ? new Date(commission.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "-",
        createdAt: commission.createdAt,
      };
    });

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    let weeklyCommission = 0;
    let monthlyCommission = 0;
    let totalCommission = 0;

    formattedCommissions.forEach((commission) => {
      const amount = Number(commission.amount || 0);

      totalCommission += amount;

      const commissionDate = new Date(commission.createdAt);

      if (commissionDate >= oneWeekAgo) {
        weeklyCommission += amount;
      }

      if (commissionDate >= oneMonthAgo) {
        monthlyCommission += amount;
      }
    });

    totalCommission = Number(totalCommission.toFixed(2));
    weeklyCommission = Number(weeklyCommission.toFixed(2));
    monthlyCommission = Number(monthlyCommission.toFixed(2));

    const totalTurnover = Number((totalCommission * 10).toFixed(2));
    const weeklyTurnover = Number((weeklyCommission * 10).toFixed(2));
    const monthlyTurnover = Number((monthlyCommission * 10).toFixed(2));

    return res.status(200).json({
      success: true,
      downlineCount,
      stats: {
        totalCommission,
        weeklyCommission,
        monthlyCommission,
        totalTurnover,
        weeklyTurnover,
        monthlyTurnover,
      },
      commissions: formattedCommissions,
    });
  } catch (error) {
    console.error("GET TURNOVER HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN: GET ALL DEPOSITS
// =====================================================

const getAllDepositsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      channel,
      phone,
      username,
      uid,
      orderId,
      transactionId,
      utr,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
      sort = "desc",
    } = req.query;

    const query = {};

    if (status !== undefined && status !== "") {
      const statusNumber = Number(status);
      if (Number.isInteger(statusNumber)) {
        query.status = statusNumber;
      }
    }

    if (paymentMethod && paymentMethod.trim()) {
      query.paymentMethod = {
        $regex: paymentMethod.trim(),
        $options: "i",
      };
    }

    if (channel && channel.trim()) {
      query.channel = { $regex: channel.trim(), $options: "i" };
    }

    if (phone && phone.trim()) {
      query.phone = { $regex: phone.trim(), $options: "i" };
    }

    if (username && username.trim()) {
      query.username = { $regex: username.trim(), $options: "i" };
    }

    if (uid && uid.trim()) {
      query.uid = { $regex: uid.trim(), $options: "i" };
    }

    if (orderId && orderId.trim()) {
      query.orderId = { $regex: orderId.trim(), $options: "i" };
    }

    if (transactionId && transactionId.trim()) {
      query.transactionId = {
        $regex: transactionId.trim(),
        $options: "i",
      };
    }

    if (utr && utr.trim()) {
      query.utr = { $regex: utr.trim(), $options: "i" };
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      const amountQuery = {};

      if (minAmount !== undefined && minAmount !== "") {
        const min = Number(minAmount);
        if (Number.isFinite(min)) {
          amountQuery.$gte = min;
        }
      }

      if (maxAmount !== undefined && maxAmount !== "") {
        const max = Number(maxAmount);
        if (Number.isFinite(max)) {
          amountQuery.$lte = max;
        }
      }

      if (Object.keys(amountQuery).length > 0) {
        query.amount = amountQuery;
      }
    }

    if (fromDate || toDate) {
      const dateQuery = {};

      if (fromDate) {
        const startDate = new Date(fromDate);
        if (!Number.isNaN(startDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          dateQuery.$gte = startDate;
        }
      }

      if (toDate) {
        const endDate = new Date(toDate);
        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDate;
        }
      }

      if (Object.keys(dateQuery).length > 0) {
        query.createdAt = dateQuery;
      }
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (currentPage - 1) * perPage;

    const sortDirection = String(sort).toLowerCase() === "asc" ? 1 : -1;

    const total = await Deposit.countDocuments(query);

    const deposits = await Deposit.find(query)
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(perPage)
      .lean();

    return res.status(200).json({
      success: true,
      message: "All deposits fetched successfully",
      total,
      currentPage,
      perPage,
      totalPages: Math.ceil(total / perPage),
      deposits,
    });
  } catch (error) {
    console.error("GET ALL DEPOSITS FOR ADMIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createDeposit,
  cancelDeposit,
  onlinePayCallback,
  getDepositStatusByIdentifier,
  getMyDeposits,
  getMyTurnoverHistory,
  getAllDepositsForAdmin,
  processLotteryEntries,
  STATUS,
};