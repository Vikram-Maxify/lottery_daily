const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit.js");
const User = require("../models/userModel");
const TransactionHistory = require("../models/TransactionHistory");
const QwackPayCallbackLog = require("../models/QwackPayCallbackLog");
const LotteryConfig = require("../models/LotteryConfig");
const Festival = require("../models/Festival");
const {
  checkNumbersAvailability,
  reserveNumbersAtomically,
  rollbackBatchReservations,
  markNumbersAsSold,
} = require("../services/ticketAvailabilityService");

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
// QWACKPAY CONFIG
// =====================================================

const QWACKPAY_BASE_URL = (
  process.env.QWACKPAY_BASE_URL || "https://qwackpay.com/api/v1"
).replace(/\/+$/, "");

const QWACKPAY_MERCHANT_ID =
  process.env.QWACKPAY_MERCHANT_ID || "636055076";

const QWACKPAY_API_KEY = process.env.QWACKPAY_API_KEY || "";

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

const getQwackPayReturnUrl = () => {
  return (
    process.env.QWACKPAY_RETURN_URL || `${getFrontendUrl()}/payment-success`
  ).replace(/\/+$/, "");
};

const getQwackPayCallbackUrl = () => {
  return (
    process.env.QWACKPAY_CALLBACK_URL ||
    `${getBackendUrl()}/api/deposit/callback`
  ).replace(/\/+$/, "");
};

// =====================================================
// HELPER: QWACKPAY SIGN
// =====================================================

const generateQwackPaySign = (params, apiKey) => {
  const clean = { ...(params || {}) };
  delete clean.sign;

  const filtered = {};

  Object.keys(clean).forEach((key) => {
    const value = clean[key];
    if (value !== null && value !== undefined && value !== "") {
      filtered[key] = value;
    }
  });

  const sortedKeys = Object.keys(filtered).sort();

  const queryString = sortedKeys
    .map((key) => `${key}=${filtered[key]}`)
    .join("&");

  const signString = `${queryString}&key=${apiKey}`;

  return crypto.createHash("md5").update(signString).digest("hex").toUpperCase();
};

// =====================================================
// HELPER: HEADERS
// =====================================================

const getQwackPayHeaders = () => ({
  "Content-Type": "application/json",
  "X-API-Key": QWACKPAY_API_KEY,
});

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
    // LOTTERY TICKET PURCHASE (QWACKPAY)
    // =====================================================

    if (normalizedChannel === "qwackpay") {
      const finalPaymentMethod = "INR";
      const finalChannel = "qwackpay";
      const money = numericAmount;

      // =====================================================
      // VALIDATE LOTTERY NUMBERS IF PROVIDED
      // =====================================================

      let normalizedLotteryNumbers = [];

      if (Array.isArray(lotteryNumbers) && lotteryNumbers.length > 0) {
        if (!configId || !mongoose.Types.ObjectId.isValid(configId)) {
          return res.status(400).json({
            success: false,
            message: "Valid configId is required for lottery purchase",
          });
        }

        let lotteryConfig = await LotteryConfig.findById(configId);
        let isFestivalConfig = false;

        if (!lotteryConfig) {
          lotteryConfig = await Festival.findById(configId);
          if (lotteryConfig) {
            isFestivalConfig = true;
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

        const ticketPrice = Number(lotteryConfig.ticketPrice || lotteryConfig.price) || 0;

        if (ticketPrice > 0 && !isFestivalConfig) {
          const expectedAmount =
            ticketPrice * normalizedLotteryNumbers.length;

          if (Math.abs(money - expectedAmount) > 1) {
            return res.status(400).json({
              success: false,
              message: `Amount mismatch. Expected ₹${expectedAmount} for ${normalizedLotteryNumbers.length} ticket(s)`,
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

        configId: configId || null,
        lotteryNumbers: normalizedLotteryNumbers,
        number:
          normalizedLotteryNumbers.length === 1
            ? normalizedLotteryNumbers[0]
            : null,
      });

      const existingEmail = String(user.email || "").trim();

      const customerEmail =
        existingEmail ||
        `customer${String(user._id)}@setthelife.com`;

      const orderPayload = {
        merchant_id: QWACKPAY_MERCHANT_ID,
        amount: Math.round(numericAmount),
        order_id: orderId,
        customer_phone: String(user.mobile || "").trim(),
        customer_email: customerEmail,
        return_url: `${getQwackPayReturnUrl()}?order_id=${encodeURIComponent(
          orderId
        )}`,
        notify_url: getQwackPayCallbackUrl(),
        callback_url: getQwackPayCallbackUrl(),
      };

      orderPayload.sign = generateQwackPaySign(
        orderPayload,
        QWACKPAY_API_KEY
      );

      console.log("=================================================");
      console.log("QWACKPAY CREATE REQUEST");
      console.log({
        merchant_id: QWACKPAY_MERCHANT_ID,
        amount: orderPayload.amount,
        order_id: orderPayload.order_id,
        customer_phone: orderPayload.customer_phone,
        customer_email: orderPayload.customer_email,
        return_url: orderPayload.return_url,
        callback_url: orderPayload.callback_url,
        lotteryNumbers: normalizedLotteryNumbers,
      });
      console.log("=================================================");

      try {
        const response = await axios.post(
          `${QWACKPAY_BASE_URL}/order/create`,
          orderPayload,
          {
            headers: getQwackPayHeaders(),
            timeout: 30000,
          }
        );

        const gatewayResponse = response.data;

        console.log("=================================================");
        console.log("QWACKPAY CREATE RESPONSE:");
        console.log(JSON.stringify(gatewayResponse, null, 2));
        console.log("=================================================");

        const paymentUrl =
          gatewayResponse?.data?.payment_url ||
          gatewayResponse?.data?.paymentUrl ||
          gatewayResponse?.payment_url ||
          gatewayResponse?.paymentUrl ||
          "";

        const returnedOrderId =
          gatewayResponse?.data?.merchant_order_id ||
          gatewayResponse?.data?.order_id ||
          gatewayResponse?.merchant_order_id ||
          gatewayResponse?.order_id ||
          orderId;

        const qwackOrderId =
          gatewayResponse?.data?.qwack_order_id ||
          gatewayResponse?.data?.qwackOrderId ||
          gatewayResponse?.qwack_order_id ||
          gatewayResponse?.qwackOrderId ||
          "";

        const gatewayCode = Number(
          gatewayResponse?.code ??
          gatewayResponse?.status_code ??
          gatewayResponse?.statusCode ??
          0
        );

        if (paymentUrl) {
          deposit.paymentUrl = String(paymentUrl);
          deposit.orderId = String(returnedOrderId);
          deposit.transactionId = String(
            qwackOrderId || returnedOrderId || orderId
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
              ? `Pending QwackPay recharge for ${normalizedLotteryNumbers.length} lottery ticket(s)`
              : "Pending QwackPay recharge",
          });

          return res.status(201).json({
            success: true,
            message: normalizedLotteryNumbers.length
              ? `QwackPay order created for ${normalizedLotteryNumbers.length} ticket(s).`
              : "QwackPay recharge order created successfully.",
            paymentUrl: String(paymentUrl),
            successUrl: getQwackPayReturnUrl(),
            callbackUrl: getQwackPayCallbackUrl(),
            orderId: deposit.orderId,
            depositId: deposit._id,
            amount: money,
            status: "pending",
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
            `QwackPay payment URL not received. Gateway code: ${gatewayCode}`,
          paymentUrl: "",
          orderId: deposit.orderId,
          gatewayResponse,
        });
      } catch (gatewayErr) {
        console.error("=================================================");
        console.error("QWACKPAY CREATE ERROR:");
        console.error(gatewayErr.response?.data || gatewayErr.message);
        console.error("=================================================");

        if (normalizedLotteryNumbers.length > 0) {
          await rollbackBatchReservations(normalizedLotteryNumbers);
        }

        deposit.status = STATUS.FAILED;
        await deposit.save();

        return res.status(502).json({
          success: false,
          message: "QwackPay payment request failed.",
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
        isBuy: true,
        prize: { first: 0, second: 0, third: 0 },
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
// QWACKPAY WEBHOOK / CALLBACK HELPERS
// =====================================================

const getCallbackValue = (body = {}, query = {}, keys = []) => {
  for (const key of keys) {
    if (
      body[key] !== undefined &&
      body[key] !== null &&
      body[key] !== ""
    ) {
      return body[key];
    }

    if (
      query[key] !== undefined &&
      query[key] !== null &&
      query[key] !== ""
    ) {
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
      lowerKey === "x-api-key"
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

// =====================================================
// QWACKPAY WEBHOOK / CALLBACK
// WALLET CREDIT DISABLED — amount only saved in Deposit
// Lottery entries pushed into LotteryConfig.users[]
// =====================================================

const onlinePayCallback = async (req, res) => {
  console.log(
    `[QWACKPAY CALLBACK HIT] ${new Date().toISOString()} method=${req.method} url=${req.originalUrl || req.url}`
  );

  let callbackLog = null;

  const setCallbackLog = async (values) => {
    if (!callbackLog?._id) return;
    try {
      await QwackPayCallbackLog.findByIdAndUpdate(callbackLog._id, {
        $set: values,
      });
    } catch (logError) {
      console.error(
        "QWACKPAY CALLBACK LOG UPDATE ERROR:",
        logError.message
      );
    }
  };

  const getGatewayValue = (source, keys) => {
    if (!source || typeof source !== "object") return undefined;
    for (const key of keys) {
      if (
        source[key] !== undefined &&
        source[key] !== null &&
        source[key] !== ""
      ) {
        return source[key];
      }
    }
    return undefined;
  };

  const normalizeGatewayResult = (response) => {
    const root = response && typeof response === "object" ? response : {};
    const data = root.data && typeof root.data === "object" ? root.data : {};
    const result =
      root.result && typeof root.result === "object" ? root.result : {};

    const statusRaw =
      getGatewayValue(data, [
        "status",
        "payment_status",
        "paymentStatus",
        "transaction_status",
        "transactionStatus",
        "order_status",
        "orderStatus",
      ]) ??
      getGatewayValue(result, [
        "status",
        "payment_status",
        "paymentStatus",
        "transaction_status",
        "transactionStatus",
        "order_status",
        "orderStatus",
      ]) ??
      getGatewayValue(root, [
        "status",
        "payment_status",
        "paymentStatus",
        "transaction_status",
        "transactionStatus",
        "order_status",
        "orderStatus",
      ]);

    const amountRaw =
      getGatewayValue(data, [
        "amount",
        "paid_amount",
        "paidAmount",
        "total_amount",
        "totalAmount",
      ]) ??
      getGatewayValue(result, [
        "amount",
        "paid_amount",
        "paidAmount",
        "total_amount",
        "totalAmount",
      ]) ??
      getGatewayValue(root, [
        "amount",
        "paid_amount",
        "paidAmount",
        "total_amount",
        "totalAmount",
      ]);

    const merchantOrderId = String(
      getGatewayValue(data, [
        "merchant_order_id",
        "merchantOrderId",
        "order_id",
        "orderId",
      ]) ??
      getGatewayValue(result, [
        "merchant_order_id",
        "merchantOrderId",
        "order_id",
        "orderId",
      ]) ??
      getGatewayValue(root, [
        "merchant_order_id",
        "merchantOrderId",
        "order_id",
        "orderId",
      ]) ??
      ""
    ).trim();

    const qwackOrderId = String(
      getGatewayValue(data, [
        "qwack_order_id",
        "qwackOrderId",
        "transaction_id",
        "transactionId",
        "payment_id",
        "paymentId",
      ]) ??
      getGatewayValue(result, [
        "qwack_order_id",
        "qwackOrderId",
        "transaction_id",
        "transactionId",
        "payment_id",
        "paymentId",
      ]) ??
      getGatewayValue(root, [
        "qwack_order_id",
        "qwackOrderId",
        "transaction_id",
        "transactionId",
        "payment_id",
        "paymentId",
      ]) ??
      ""
    ).trim();

    const utr = String(
      getGatewayValue(data, [
        "utr",
        "utr_number",
        "utrNumber",
        "rrn",
        "reference",
        "reference_number",
      ]) ??
      getGatewayValue(result, [
        "utr",
        "utr_number",
        "utrNumber",
        "rrn",
        "reference",
        "reference_number",
      ]) ??
      getGatewayValue(root, [
        "utr",
        "utr_number",
        "utrNumber",
        "rrn",
        "reference",
        "reference_number",
      ]) ??
      ""
    ).trim();

    const status = String(statusRaw ?? "").trim().toLowerCase();
    const amount = Number(amountRaw);

    const successStatuses = [
      "success",
      "successful",
      "paid",
      "completed",
      "complete",
      "approved",
      "1",
    ];

    const failedStatuses = [
      "failed",
      "failure",
      "declined",
      "rejected",
      "cancelled",
      "canceled",
      "2",
      "3",
    ];

    const pendingStatuses = [
      "",
      "pending",
      "processing",
      "initiated",
      "created",
      "unpaid",
      "0",
    ];

    return {
      status,
      amount,
      merchantOrderId,
      qwackOrderId,
      utr,
      raw: root,
      isSuccess: successStatuses.includes(status),
      isFailed: failedStatuses.includes(status),
      isPending: pendingStatuses.includes(status),
    };
  };

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const query = req.query && typeof req.query === "object" ? req.query : {};

  console.log("=================================================");
  console.log("QWACKPAY CALLBACK RECEIVED");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl || req.url || "");
  console.log("IP:", getCallbackIp(req));
  console.log("BODY:", JSON.stringify(body, null, 2));
  console.log("QUERY:", JSON.stringify(query, null, 2));
  console.log("=================================================");

  const merchantOrderId = String(
    getCallbackValue(body, query, [
      "merchant_order_id",
      "merchantOrderId",
      "merchant_order",
      "merchantOrder",
      "order_id",
      "orderId",
    ]) || ""
  ).trim();

  const qwackOrderId = String(
    getCallbackValue(body, query, [
      "qwack_order_id",
      "qwackOrderId",
      "transaction_id",
      "transactionId",
      "payment_id",
      "paymentId",
    ]) || ""
  ).trim();

  const amountRaw = getCallbackValue(body, query, [
    "amount",
    "paid_amount",
    "paidAmount",
    "total_amount",
    "totalAmount",
  ]);

  const gatewayStatus = String(
    getCallbackValue(body, query, [
      "status",
      "payment_status",
      "paymentStatus",
      "transaction_status",
      "transactionStatus",
      "order_status",
      "orderStatus",
    ]) || ""
  ).trim();

  const utr = String(
    getCallbackValue(body, query, [
      "utr",
      "utr_number",
      "utrNumber",
      "rrn",
      "reference",
      "reference_number",
    ]) || ""
  ).trim();

  const receivedSign = String(
    getCallbackValue(body, query, ["sign", "signature"]) || ""
  ).trim();

  const callbackAmount = Number(amountRaw);

  // =====================================================
  // LOG CREATION (isolated try/catch)
  // =====================================================

  try {
    callbackLog = await QwackPayCallbackLog.create({
      merchantOrderId,
      qwackOrderId,
      amount: Number.isFinite(callbackAmount) ? callbackAmount : 0,
      gatewayStatus,
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
      message: "QwackPay callback received",
    });

    console.log(
      "QWACKPAY CALLBACK LOG SAVED:",
      callbackLog._id.toString()
    );
  } catch (logCreateError) {
    console.error(
      "QWACKPAY CALLBACK LOG CREATE ERROR (continuing without log):",
      logCreateError.message
    );
    callbackLog = null;
  }

  try {
    // Health check
    if (req.method === "GET" && !merchantOrderId && !qwackOrderId) {
      await setCallbackLog({
        event: "HEALTH_CHECK",
        processingStatus: "SUCCESS",
        message:
          "Callback endpoint health check (no order data - not a real payment callback)",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    if (!merchantOrderId && !qwackOrderId) {
      await setCallbackLog({
        event: "NO_ORDER_ID",
        processingStatus: "SUCCESS",
        message: "Callback received without order ID; no action taken",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    // =====================================================
    // FIND DEPOSIT
    // =====================================================

    const orderConditions = [];

    if (merchantOrderId) {
      orderConditions.push({ orderId: merchantOrderId });
    }

    if (qwackOrderId) {
      orderConditions.push({ transactionId: qwackOrderId });
    }

    let deposit = null;

    if (orderConditions.length) {
      deposit = await Deposit.findOne({ $or: orderConditions });
    }

    if (!deposit && merchantOrderId) {
      deposit = await Deposit.findOne({ orderId: merchantOrderId });
    }

    if (!deposit && qwackOrderId) {
      deposit = await Deposit.findOne({ transactionId: qwackOrderId });
    }

    if (!deposit) {
      await setCallbackLog({
        event: "DEPOSIT_NOT_FOUND",
        processingStatus: "FAILED",
        message: `Deposit not found for merchantOrderId=${merchantOrderId}, qwackOrderId=${qwackOrderId}`,
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    await setCallbackLog({ depositId: deposit._id });

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
          console.error(
            "LATE LOTTERY PROCESSING ERROR:",
            lotteryError.message
          );
        }
      }

      await setCallbackLog({
        event: "ALREADY_PROCESSED",
        processingStatus: "SUCCESS",
        message: "Payment already processed",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    if (Number(deposit.status) === STATUS.CANCELLED) {
      await setCallbackLog({
        event: "CANCELLED_DEPOSIT",
        processingStatus: "SUCCESS",
        message: "Deposit was already cancelled",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    // =====================================================
    // SIGNATURE CHECK
    // =====================================================

    const webhookPayload = {
      merchant_order_id: merchantOrderId,
      qwack_order_id: qwackOrderId,
      amount: amountRaw,
      status: gatewayStatus,
      utr,
    };

    const expectedSign = generateQwackPaySign(
      webhookPayload,
      QWACKPAY_API_KEY
    );

    const signValid =
      Boolean(receivedSign) &&
      expectedSign.toUpperCase() === receivedSign.toUpperCase();

    await setCallbackLog({
      signValid,
      event: signValid ? "SIGN_VALID" : "SIGN_INVALID",
    });

    console.log("QWACKPAY SIGN CHECK:", {
      expectedSign,
      receivedSign: receivedSign.toUpperCase(),
      signValid,
    });

    // =====================================================
    // VERIFY GATEWAY STATUS
    // =====================================================

    let verified = signValid;
    let gatewayResult = null;

    const callbackStatusLower = gatewayStatus.toLowerCase();

    const callbackLooksSuccess = [
      "success",
      "successful",
      "paid",
      "completed",
      "complete",
      "approved",
      "1",
    ].includes(callbackStatusLower);

    const callbackLooksFailed = [
      "failed",
      "failure",
      "declined",
      "rejected",
      "cancelled",
      "canceled",
      "2",
      "3",
    ].includes(callbackStatusLower);

    const mustQueryGateway =
      !signValid ||
      !callbackLooksSuccess ||
      !Number.isFinite(callbackAmount) ||
      callbackAmount <= 0;

    if (mustQueryGateway) {
      try {
        const queryOrderId = merchantOrderId || deposit.orderId;
        const queryResponse = await checkQwackPayOrderStatus(queryOrderId);
        gatewayResult = normalizeGatewayResult(queryResponse);

        console.log("QWACKPAY VERIFIED QUERY:", {
          orderId: queryOrderId,
          status: gatewayResult.status,
          amount: gatewayResult.amount,
          merchantOrderId: gatewayResult.merchantOrderId,
          qwackOrderId: gatewayResult.qwackOrderId,
          utr: gatewayResult.utr,
        });

        if (gatewayResult.isSuccess) {
          verified = true;
        }
      } catch (queryError) {
        console.error(
          "QWACKPAY ORDER QUERY ERROR:",
          queryError.response?.data || queryError.message
        );
      }
    }

    const finalStatus = gatewayResult?.isSuccess
      ? "success"
      : gatewayResult?.isFailed
        ? "failed"
        : callbackStatusLower;

    const finalAmount =
      gatewayResult &&
        Number.isFinite(gatewayResult.amount) &&
        gatewayResult.amount > 0
        ? gatewayResult.amount
        : callbackAmount;

    const finalUtr = gatewayResult?.utr || utr || deposit.utr || "";

    const finalQwackOrderId =
      gatewayResult?.qwackOrderId || qwackOrderId || "";

    // =====================================================
    // DO NOT FAIL PENDING/UNKNOWN PAYMENTS
    // =====================================================

    if (!verified && !signValid) {
      await setCallbackLog({
        event: "VERIFICATION_PENDING",
        processingStatus: "SUCCESS",
        message:
          gatewayResult?.isPending || !gatewayResult?.status
            ? "Callback received; gateway payment is not yet verified"
            : "Callback signature invalid and gateway query did not verify success",
        error: receivedSign
          ? `Expected ${expectedSign}, received ${receivedSign.toUpperCase()}`
          : "Callback signature missing",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    // =====================================================
    // EXPLICIT VERIFIED FAILURE
    // =====================================================

    if (
      finalStatus === "failed" &&
      (signValid || gatewayResult?.isFailed)
    ) {
      await Deposit.findOneAndUpdate(
        { _id: deposit._id, status: STATUS.PENDING },
        {
          $set: {
            status: STATUS.FAILED,
            utr: finalUtr,
            transactionId:
              finalQwackOrderId || finalUtr || deposit.transactionId,
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
            remark: `QwackPay recharge failed. Status: ${gatewayResult?.status || gatewayStatus
              }`,
            updatedAt: new Date(),
          },
        },
        { sort: { createdAt: -1 } }
      );

      await setCallbackLog({
        event: "PAYMENT_FAILED",
        processingStatus: "SUCCESS",
        message: `Verified payment failure: ${gatewayResult?.status || gatewayStatus
          }`,
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    // =====================================================
    // PENDING / UNKNOWN
    // =====================================================

    if (finalStatus !== "success") {
      await setCallbackLog({
        event: "PAYMENT_PENDING",
        processingStatus: "SUCCESS",
        message: `Payment is still pending. Callback status=${gatewayStatus || "unknown"
          }`,
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    // =====================================================
    // SUCCESS VALIDATION
    // =====================================================

    if (!verified) {
      await setCallbackLog({
        event: "SUCCESS_NOT_VERIFIED",
        processingStatus: "FAILED",
        message: "Success callback could not be verified",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      await setCallbackLog({
        event: "INVALID_AMOUNT",
        processingStatus: "FAILED",
        message: `Invalid verified amount: ${finalAmount}`,
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    const depositAmount = Number(deposit.amount);

    if (
      Number.isFinite(depositAmount) &&
      Math.abs(finalAmount - depositAmount) > 0.01
    ) {
      await setCallbackLog({
        event: "AMOUNT_MISMATCH",
        processingStatus: "FAILED",
        message: `Amount mismatch. Deposit=${depositAmount}, Gateway=${finalAmount}`,
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    const user = await User.findById(deposit.userId);

    if (!user) {
      await setCallbackLog({
        event: "USER_NOT_FOUND",
        processingStatus: "FAILED",
        message: "User not found",
        processedAt: new Date(),
      });

      return res.status(200).send("success");
    }

    // =====================================================
    // ATOMIC DEPOSIT + LOTTERY TRANSACTION
    // ⚠️ WALLET CREDIT DISABLED
    // =====================================================

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

        const freshUser = await User.findById(deposit.userId).session(
          session
        );

        if (!freshUser) {
          throw new Error("User not found while processing QwackPay payment");
        }

        // =====================================================
        // ❌ WALLET CREDIT DISABLED
        // User wallet is NOT updated. Amount only saved in Deposit.
        // =====================================================

        updatedWallet = freshUser.wallet;

        // =====================================================
        // UPDATE DEPOSIT → SUCCESS
        // =====================================================

        const depositUpdate = await Deposit.findOneAndUpdate(
          {
            _id: freshDeposit._id,
            status: STATUS.PENDING,
          },
          {
            $set: {
              status: STATUS.SUCCESS,
              utr: finalUtr,
              transactionId:
                finalQwackOrderId || finalUtr || freshDeposit.transactionId,
            },
          },
          { new: true, session }
        );

        if (!depositUpdate) {
          throw new Error("Deposit could not be claimed");
        }

        // =====================================================
        // UPDATE TRANSACTION HISTORY
        // =====================================================

        const successRemark = freshDeposit.lotteryNumbers?.length
          ? `Lottery purchase successful via QwackPay. UTR: ${finalUtr || "N/A"
          }. ${freshDeposit.lotteryNumbers.length} ticket(s) added. Amount: ₹${finalAmount}`
          : `Payment successful via QwackPay. UTR: ${finalUtr || "N/A"
          }. Amount: ₹${finalAmount}`;

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

        // =====================================================
        // PROCESS LOTTERY ENTRIES (push into LotteryConfig.users[])
        // =====================================================

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

      return res.status(200).send("success");
    }

    await setCallbackLog({
      event: "PAYMENT_SUCCESS",
      processingStatus: "SUCCESS",
      signValid: signValid || Boolean(gatewayResult?.isSuccess),
      message: `₹${finalAmount} processed (wallet unchanged). Lottery entries: ${lotteryResult?.createdCount || 0
        } added.`,
      processedAt: new Date(),
    });

    console.log("=================================================");
    console.log("QWACKPAY CALLBACK SUCCESS");
    console.log("ORDER:", merchantOrderId || deposit.orderId);
    console.log("QWACK ORDER:", finalQwackOrderId);
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

    return res.status(200).send("success");
  } catch (error) {
    console.error(
      "QWACKPAY CALLBACK ERROR:",
      error.response?.data || error.message
    );

    await setCallbackLog({
      event: "EXCEPTION",
      processingStatus: "FAILED",
      message: "Callback processing exception",
      error: error.message,
      processedAt: new Date(),
    });

    return res.status(200).send("success");
  }
};

// =====================================================
// CHECK QWACKPAY ORDER STATUS
// =====================================================

const checkQwackPayOrderStatus = async (orderId) => {
  try {
    if (!orderId) {
      return null;
    }

    const payload = {
      merchant_id: QWACKPAY_MERCHANT_ID,
      order_id: orderId,
    };

    payload.sign = generateQwackPaySign(payload, QWACKPAY_API_KEY);

    const response = await axios.post(
      `${QWACKPAY_BASE_URL}/order/query`,
      payload,
      {
        headers: getQwackPayHeaders(),
        timeout: 30000,
      }
    );

    console.log("QWACKPAY QUERY RESPONSE:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "QWACKPAY QUERY ERROR:",
      error.response?.data || error.message
    );

    return null;
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
// TEST ONLY: GENERATE QWACKPAY SIGN
// =====================================================

const generateTestQwackPaySign = async (req, res) => {
  try {
    const {
      merchant_order_id,
      qwack_order_id,
      amount,
      status,
      utr = "",
    } = req.body || {};

    if (!merchant_order_id) {
      return res.status(400).json({
        success: false,
        message: "merchant_order_id is required",
      });
    }

    if (!qwack_order_id) {
      return res.status(400).json({
        success: false,
        message: "qwack_order_id is required",
      });
    }

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        success: false,
        message: "amount is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    if (!QWACKPAY_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "QWACKPAY_API_KEY is not configured",
      });
    }

    const payload = {
      merchant_order_id: String(merchant_order_id).trim(),
      qwack_order_id: String(qwack_order_id).trim(),
      amount: String(amount).trim(),
      status: String(status).trim(),
      utr: String(utr || "").trim(),
    };

    const sign = generateQwackPaySign(payload, QWACKPAY_API_KEY);

    console.log("===============================================");
    console.log("QWACKPAY TEST SIGN");
    console.log("PAYLOAD:", payload);
    console.log("GENERATED SIGN:", sign);
    console.log("===============================================");

    return res.status(200).json({
      success: true,
      message: "QwackPay test sign generated",
      data: {
        ...payload,
        sign,
      },
    });
  } catch (error) {
    console.error("GENERATE QWACKPAY TEST SIGN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate test sign",
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
  checkQwackPayOrderStatus,
  generateQwackPaySign,
  generateTestQwackPaySign,
  processLotteryEntries,
  STATUS,
};