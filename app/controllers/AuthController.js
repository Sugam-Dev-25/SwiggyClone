const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const TokenUtils = require("../utils/tokenUtils");

class AuthController {
  async register(req, res) {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user"
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  async login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account blocked"
      });
    }

    const accessToken = TokenUtils.createAccessToken(user);
    const refreshToken = TokenUtils.createRefreshToken(user);

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const decoded = jwt.decode(refreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(decoded.exp * 1000)
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  async refresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required"
      });
    }

    let payload;

    try {
      payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const stored = await RefreshToken.findOne({
      user: payload.sub,
      tokenHash,
      revokedAt: null
    });

    if (!stored || stored.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Refresh token revoked or expired"
      });
    }

    stored.revokedAt = new Date();
    await stored.save();

    const user = await User.findById(payload.sub);

    if (!user || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: "User unavailable"
      });
    }

    const newAccessToken = TokenUtils.createAccessToken(user);
    const newRefreshToken = TokenUtils.createRefreshToken(user);

    const newHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    const decoded = jwt.decode(newRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newHash,
      expiresAt: new Date(decoded.exp * 1000)
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  }

  async logout(req, res) {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await RefreshToken.updateOne(
        {
          user: req.user._id,
          tokenHash,
          revokedAt: null
        },
        {
          $set: { revokedAt: new Date() }
        }
      );
    }

    res.json({
      success: true,
      message: "Logout successful"
    });
  }
}

module.exports = new AuthController();