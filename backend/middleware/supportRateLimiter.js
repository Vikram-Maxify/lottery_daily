// Sliding window in-memory rate limiter for support APIs
const buckets = new Map();

// Periodic cleanup to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now > entry.resetAt) {
      buckets.delete(key);
    }
  }
}, 60 * 1000).unref();

const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 40,
  keyPrefix = "support",
  message = "Too many requests. Please slow down and try again shortly.",
} = {}) => {
  return (req, res, next) => {
    const identifier =
      req.user?.id ||
      req.user?.uuid ||
      req.ip ||
      req.connection?.remoteAddress ||
      "anon";

    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const record = buckets.get(key);

    if (!record || now > record.resetAt) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    record.count += 1;
    return next();
  };
};

const ticketCreationLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 25,
  keyPrefix: "support_ticket_create",
  message: "You have created too many support tickets recently. Please wait a few minutes.",
});

const messageSendLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  keyPrefix: "support_message_send",
  message: "You are sending messages too quickly. Please wait a moment.",
});

module.exports = {
  createRateLimiter,
  ticketCreationLimiter,
  messageSendLimiter,
};
