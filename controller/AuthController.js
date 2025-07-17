/** @format */

const User = require("../models/UserModels");
const jwt = require("jsonwebtoken");
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const generateAccessToken = (id) => {
  logger.info("Generating access token", { userId: id });
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m", //waktu token expired
  });
};

const generateRefreshToken = (id) => {
  logger.info("Generating refresh token", { userId: id });
  return jwt.sign(
    {
      id,
      version: Date.now(),
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "300m",
    }
  );
};

const login = async (req, res) => {
  logger.info("Login attempt", { email: req.body.email });
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Login failed: Email not valid", { email });
      return res
        .status(401)
        .json(
          apiResponse.error(
            "Email invalid, email not found",
            STATUS_CODES.UNAUTHORIZED,
            null
          )
        );
    } else if (!(await user.comparePassword(password))) {
      logger.warn("Login failed: Invalid credentials", { email });
      return res
        .status(401)
        .json(
          apiResponse.error("Wrong Password", STATUS_CODES.UNAUTHORIZED, null)
        );
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info("Setting cookies for successful login", {
      userId: user._id,
      environment: process.env.NODE_ENV,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    const data = {
      _id: user._id,
      accessToken,
    };

    logger.info("Login successful", {
      userId: user._id,
      role: user.role,
    });

    res.json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data));
  } catch (error) {
    logger.error("Login error", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const refresh = async (req, res) => {
  logger.info("Token refresh attempt");
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.warn("Token refresh failed: No refresh token provided");
      return res
        .status(555)
        .json(
          apiResponse.error(
            "Refresh token not found",
            STATUS_CODES.UNAUTHORIZED,
            null
          )
        );
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    logger.info("Refresh token verified", { userId: decoded.id });

    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn("Token refresh failed: User not found", {
        userId: decoded.id,
      });
      return res
        .status(555)
        .json(
          apiResponse.error("User not found", STATUS_CODES.FORBIDDEN, null)
        );
    }

    const accessToken = generateAccessToken(user._id);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
    });

    logger.info("Access token refreshed successfully", { userId: user._id });
    res.json(
      apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, accessToken)
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("Token refresh failed: Refresh token expired");
      return res
        .status(555)
        .json(
          apiResponse.error(
            "Refresh token expired",
            STATUS_CODES.FORBIDDEN,
            null
          )
        );
    }
    logger.error("Token refresh error", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(555)
      .json(
        apiResponse.error("Invalid refresh token", STATUS_CODES.FORBIDDEN, null)
      );
  }
};

const logout = async (req, res) => {
  logger.info("Logout attempt", {
    userId: req.user?._id,
  });

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  logger.info("Logout successful", {
    userId: req.user?._id,
  });

  res.json(
    apiResponse.success("Logged out successfully", STATUS_CODES.OK, null)
  );
};

const forgotPassword = async (req, res) => {
  let emailSent = false; // Tambahkan flag untuk mencegah pengiriman ganda
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json(
          apiResponse.error(
            "Email tidak ditemukan",
            STATUS_CODES.NOT_FOUND,
            null
          )
        );
    }

    // Periksa apakah sudah ada token reset yang belum kedaluwarsa
    if (user.passwordResetExpires && user.passwordResetExpires > Date.now()) {
      return res
        .status(400)
        .json(
          apiResponse.error(
            "Permintaan reset password sebelumnya masih berlaku",
            STATUS_CODES.BAD_REQUEST,
            null
          )
        );
    }

    // Generate token reset yang unik
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 menit
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    if (!emailSent) {
      emailSent = true; // Set flag untuk mencegah pengiriman ganda

      // Mengirim email
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Permintaan Reset Kata Sandi",
        html: `
                    <!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Kata Sandi</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            animation: slideIn 0.8s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="80" r="2.5" fill="rgba(255,255,255,0.1)"/></svg>');
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
            backdrop-filter: blur(10px);
        }
        
        .logo svg {
            width: 40px;
            height: 40px;
            fill: white;
        }
        
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 50px 40px;
        }
        
        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 30px;
            font-weight: 600;
        }
        
        .main-text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 35px;
            line-height: 1.7;
        }
        
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .reset-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .reset-button:hover::before {
            left: 100%;
        }
        
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }
        
        .warning-box {
            background: linear-gradient(135deg, #fef5e7 0%, #fff4e0 100%);
            border-left: 4px solid #f6ad55;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        
        .warning-box .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 10px;
            vertical-align: middle;
        }
        
        .warning-text {
            font-size: 14px;
            color: #d69e2e;
            font-weight: 600;
            display: inline-block;
            vertical-align: middle;
        }
        
        .security-notice {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .security-notice h3 {
            color: #2d3748;
            font-size: 16px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .security-notice p {
            color: #718096;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .footer p {
            color: #718096;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .company-name {
            color: #4a5568;
            font-weight: 600;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 30px 0;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 20px auto;
                border-radius: 12px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 25px;
            }
            
            .footer {
                padding: 25px 25px;
            }
            
            .reset-button {
                padding: 14px 30px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Reset Kata Sandi</h1>
            <p>Permintaan reset kata sandi untuk akun Anda</p>
        </div>
        
        <div class="content">
            <div class="greeting">Halo ${user.name}!</div>
            
            <div class="main-text">
                Kami menerima permintaan untuk mereset kata sandi akun Anda. Jika Anda yang melakukan permintaan ini, silakan klik tombol di bawah untuk melanjutkan proses reset kata sandi.
            </div>
            
            <div class="cta-container">
                <a href="${resetUrl}" class="reset-button">
                    Reset Kata Sandi Sekarang
                </a>
            </div>
            
            <div class="warning-box">
                <svg class="icon" viewBox="0 0 24 24" fill="#d69e2e">
                    <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,21.5A1.5,1.5 0 0,1 10.5,20A1.5,1.5 0 0,1 12,18.5A1.5,1.5 0 0,1 13.5,20A1.5,1.5 0 0,1 12,21.5M16,6A1,1 0 0,1 17,7A1,1 0 0,1 16,8A1,1 0 0,1 15,7A1,1 0 0,1 16,6M7,12A1,1 0 0,1 8,13A1,1 0 0,1 7,14A1,1 0 0,1 6,13A1,1 0 0,1 7,12Z"/>
                </svg>
                <span class="warning-text">Tautan ini akan kedaluwarsa dalam 15 menit</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="security-notice">
                <h3>🔒 Keamanan Akun Anda</h3>
                <p>Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini dan kata sandi Anda akan tetap aman. Kami merekomendasikan untuk menggunakan kata sandi yang kuat dan unik untuk keamanan maksimal.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon jangan membalas email ini.</p>
            <p>Jika Anda membutuhkan bantuan, silakan hubungi <span class="company-name">Tim Support Kami</span></p>
            <p style="margin-top: 15px; font-size: 12px; color: #a0aec0;">
                © 2025 Frystra. Semua hak dilindungi.
            </p>
        </div>
    </div>
</body>
</html>
                `,
      };

      await transporter.sendMail(mailOptions); // Kirim email
      logger.info("Email reset password dikirim", { email: user.email });
    }

    res.json(
      apiResponse.success(
        "Email reset kata sandi telah dikirim",
        STATUS_CODES.OK,
        null
      )
    );
  } catch (error) {
    logger.error("Terjadi kesalahan saat mengirim email reset password", {
      error: error.message,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          "Terjadi kesalahan saat mengirim email",
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null
        )
      );
  }
};

const resetPassword = async (req, res) => {
  let isResponseSent = false;

  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      logger.warn("Reset password failed: Missing required fields");
      isResponseSent = true;
      return res
        .status(400)
        .json(
          apiResponse.error(
            "Token and new password are required",
            STATUS_CODES.BAD_REQUEST,
            null
          )
        );
    }

    // Find user by reset token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn("Reset password failed: Invalid or expired token", {
        receivedTokenHash: token,
      });
      isResponseSent = true;
      return res
        .status(400)
        .json(
          apiResponse.error(
            "Invalid or expired reset password token",
            STATUS_CODES.BAD_REQUEST,
            null
          )
        );
    }

    // Validate password requirements
    if (newPassword.length < 8) {
      logger.warn("Reset password failed: Password too short");
      isResponseSent = true;
      return res
        .status(400)
        .json(
          apiResponse.error(
            "Password must be at least 8 characters long",
            STATUS_CODES.BAD_REQUEST,
            null
          )
        );
    }

    // Update user's password and clear reset token fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save the updated user document
    await user.save();

    logger.info("Password reset successful", { userId: user._id });

    if (!isResponseSent) {
      isResponseSent = true;
      return res
        .status(200)
        .json(
          apiResponse.success(
            "Password has been reset successfully",
            STATUS_CODES.OK,
            null
          )
        );
    }
  } catch (error) {
    logger.error("Reset password error", {
      error: error.message,
      stack: error.stack,
    });

    if (!isResponseSent) {
      isResponseSent = true;
      return res
        .status(500)
        .json(
          apiResponse.error(
            "An error occurred while resetting the password",
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            null
          )
        );
    }
  }
};

module.exports = { login, refresh, logout, forgotPassword, resetPassword };
