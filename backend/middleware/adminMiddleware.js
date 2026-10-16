const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
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

      req.user = jwt.verify(token, process.env.JWT_SECRET);
    }

    if (req.user?.role === "admin") {
      return next();
    }

    // Fallback check against DB in case user role was recently promoted
    const dbUser = await User.findOne(
      req.user?.id ? { _id: req.user.id } : { uuid: req.user?.uuid }
    )
      .select("_id uuid role name mobile")
      .lean();

    if (dbUser && dbUser.role === "admin") {
      req.user.role = "admin";
      req.user.id = dbUser._id;
      req.user.uuid = dbUser.uuid;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin access required",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = adminMiddleware;
