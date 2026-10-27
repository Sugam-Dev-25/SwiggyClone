const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  let payload;

  try {
    payload = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_ACCESS_SECRET
    );
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  const user = await User.findById(payload.sub);

  if (!user || user.isBlocked) {
    return res.status(401).json({
      success: false,
      message: "User not found or blocked"
    });
  }

  req.user = user;
  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    next();
  };
};

exports.requireAdminSecret = (req, res, next) => {
  const supplied = req.headers["x-admin-secret"];
  const expected = process.env.ADMIN_SECRET_KEY;

  if (!expected || !supplied || supplied !== expected) {
    return res.status(403).json({
      success: false,
      message: "Invalid admin secret key"
    });
  }

  next();
};