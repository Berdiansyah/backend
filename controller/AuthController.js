const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/ApiResponse');
const STATUS_CODES = require('../constants/StatusCode');
const STATUS_MESSAGES = require('../constants/Message');
const logger = require('../utils/Logger');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateAccessToken = (id) => {
    logger.info('Generating access token', { userId: id });
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '120m' //waktu token expired
    });
};

const generateRefreshToken = (id) => {
    logger.info('Generating refresh token', { userId: id });
    return jwt.sign(
        { 
            id,
            version: Date.now()
        }, 
        process.env.REFRESH_TOKEN_SECRET, 
        {
            expiresIn: '1d'
        }
    );
};

const login = async (req, res) => {
    logger.info('Login attempt', { email: req.body.email });
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('Login failed: Email not valid', { email });
            return res.status(401).json(apiResponse.error('Email invalid, email not found', STATUS_CODES.UNAUTHORIZED, null ));
        }else if(!await user.comparePassword(password)){
            logger.warn('Login failed: Invalid credentials', { email });
            return res.status(401).json(apiResponse.error('Wrong Password', STATUS_CODES.UNAUTHORIZED, null ));
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        logger.info('Setting cookies for successful login', { 
            userId: user._id, 
            environment: process.env.NODE_ENV 
        });

        res.cookie('accessToken', accessToken,{
            httpOnly:true
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 1 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        const data = {
            _id: user._id,
            accessToken
        };

        logger.info('Login successful', { 
            userId: user._id,
            role: user.role
        });

        res.json(apiResponse.success(STATUS_MESSAGES[200],STATUS_CODES.OK, data));
    } catch (error) {
        logger.error('Login error', { 
            error: error.message,
            stack: error.stack
        });
        res.status(500).json(apiResponse.error( error.message , 500, null));
    }
};

const refresh = async (req, res) => {
    logger.info('Token refresh attempt');
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            logger.warn('Token refresh failed: No refresh token provided');
            return res.status(401).json(apiResponse.error('Refresh token not found',STATUS_CODES.UNAUTHORIZED, null));
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        logger.info('Refresh token verified', { userId: decoded.id });
        
        const user = await User.findById(decoded.id);
        if (!user) {
            logger.warn('Token refresh failed: User not found', { userId: decoded.id });
            return res.status(403).json(apiResponse.error('User not found', STATUS_CODES.FORBIDDEN, null));
        }

        const accessToken = generateAccessToken(user._id);
        res.cookie('accessToken', accessToken,{
            httpOnly:true
        });

        logger.info('Access token refreshed successfully', { userId: user._id });
        res.json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, accessToken));
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn('Token refresh failed: Refresh token expired');
            return res.status(403).json(apiResponse.error('Refresh token expired', STATUS_CODES.FORBIDDEN, null));
        }
        logger.error('Token refresh error', {
            error: error.message,
            stack: error.stack
        });
        res.status(403).json(apiResponse.error('Invalid refresh token', STATUS_CODES.FORBIDDEN, null));
    }
};

const logout = async (req, res) => {
    logger.info('Logout attempt', { 
        userId: req.user?._id 
    });

    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    logger.info('Logout successful', { 
        userId: req.user?._id 
    });
    
    res.json(apiResponse.success('Logged out successfully', STATUS_CODES.OK, null));
};

const forgotPassword = async (req, res) => {
    let emailSent = false; // Tambahkan flag untuk mencegah pengiriman ganda
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json(apiResponse.error('Email tidak ditemukan', STATUS_CODES.NOT_FOUND, null));
        }

        // Periksa apakah sudah ada token reset yang belum kedaluwarsa
        if (user.passwordResetExpires && user.passwordResetExpires > Date.now()) {
            return res.status(400).json(apiResponse.error('Permintaan reset password sebelumnya masih berlaku', STATUS_CODES.BAD_REQUEST, null));
        }

        // Generate token reset yang unik
        const resetToken = crypto.randomBytes(32).toString('hex');

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 menit
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        if (!emailSent) {
            emailSent = true; // Set flag untuk mencegah pengiriman ganda

            // Mengirim email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Permintaan Reset Kata Sandi',
                html: `
                    <html>
                        <body>
                            <p>Halo,</p>
                            <p>Anda telah meminta untuk mereset kata sandi Anda. Untuk melanjutkan, silakan klik tautan berikut:</p>
                            <p><a href="${resetUrl}" style="font-weight: bold;">Reset Kata Sandi</a></p>
                            <p>Perlu diingat bahwa tautan ini akan kedaluwarsa dalam 15 menit.</p>
                            <p>Jika Anda tidak merasa meminta reset kata sandi, Anda bisa mengabaikan email ini.</p>
                            <p>Terima kasih,</p>
                            <p>Tim Support Kami</p>
                        </body>
                    </html>
                `,
            };

            await transporter.sendMail(mailOptions); // Kirim email
            logger.info('Email reset password dikirim', { email: user.email });
        }

        res.json(apiResponse.success('Email reset kata sandi telah dikirim', STATUS_CODES.OK, null));
    } catch (error) {
        logger.error('Terjadi kesalahan saat mengirim email reset password', { error: error.message });
        res.status(500).json(apiResponse.error('Terjadi kesalahan saat mengirim email', STATUS_CODES.INTERNAL_SERVER_ERROR, null));
    }
};


const resetPassword = async (req, res) => {
    let isResponseSent = false;

    try {
        const { token, newPassword } = req.body;

        // Validate input
        if (!token || !newPassword) {
            logger.warn('Reset password failed: Missing required fields');
            isResponseSent = true;
            return res.status(400).json(
                apiResponse.error('Token and new password are required', STATUS_CODES.BAD_REQUEST, null)
            );
        }

        // Find user by reset token that hasn't expired
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn('Reset password failed: Invalid or expired token', { 
                receivedTokenHash: token 
            });
            isResponseSent = true;
            return res.status(400).json(
                apiResponse.error('Invalid or expired reset password token', STATUS_CODES.BAD_REQUEST, null)
            );
        }

        // Validate password requirements
        if (newPassword.length < 8) {
            logger.warn('Reset password failed: Password too short');
            isResponseSent = true;
            return res.status(400).json(
                apiResponse.error('Password must be at least 8 characters long', STATUS_CODES.BAD_REQUEST, null)
            );
        }

        // Update user's password and clear reset token fields
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Save the updated user document
        await user.save();

        logger.info('Password reset successful', { userId: user._id });

        if (!isResponseSent) {
            isResponseSent = true;
            return res.status(200).json(
                apiResponse.success('Password has been reset successfully', STATUS_CODES.OK, null)
            );
        }

    } catch (error) {
        logger.error('Reset password error', { 
            error: error.message,
            stack: error.stack 
        });

        if (!isResponseSent) {
            isResponseSent = true;
            return res.status(500).json(
                apiResponse.error(
                    'An error occurred while resetting the password', 
                    STATUS_CODES.INTERNAL_SERVER_ERROR, 
                    null
                )
            );
        }
    }
};

module.exports = { login, refresh, logout, forgotPassword, resetPassword  };