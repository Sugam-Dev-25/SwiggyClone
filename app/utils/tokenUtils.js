const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class TokenUtils {
  static createAccessToken(user) {
    return jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m"
      }
    );
  }

  static createRefreshToken(user) {
    const tokenId = crypto.randomUUID();

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        jti: tokenId
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d"
      }
    );

    return token;
  }
}

module.exports = TokenUtils;