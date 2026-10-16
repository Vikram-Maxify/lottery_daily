const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const bearerHeader = req.headers?.authorization;
    const bearerToken =
      typeof bearerHeader === "string" && bearerHeader.startsWith("Bearer ")
        ? bearerHeader.slice(7).trim()
        : null;

    const token = req.cookies?.usertoken || bearerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;