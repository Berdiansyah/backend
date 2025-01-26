const jwt = require('jsonwebtoken');
const User = require('../models/UserModels');
const logger = require('../utils/Logger');

const protect = async (req, res, next) => {
  const path = req.path;
  const method = req.method;

  logger.info('Authentication middleware started', {
    path,
    method,
    ip: req.ip,
  });

  try {
    // Ambil token dari cookies
    const token = req.cookies?.accessToken;

    if (!token || typeof token !== 'string') {
      logger.warn('Authentication failed: Invalid or missing token', {
        path,
        method,
        ip: req.ip,
      });
      return res.status(405).json({ message: 'Not authorized, no valid token provided' });
    }

    // Verifikasi token menggunakan JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cari user berdasarkan ID yang ada di payload token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.id,
        path,
        method,
      });
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info('Authentication successful', {
      userId: user._id,
      path,
      method,
      userRole: user.role,
    });

    // Tambahkan data user ke objek request
    logger.info(user)
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired', {
        error: error.message,
        path,
        method,
      });
      return res.status(555).json({ message: 'Token expired, please log in again' });
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed: Invalid token', {
        error: error.message,
        path,
        method,
      });
      return res.status(556).json({ message: 'Invalid token' });
    }

    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      path,
      method,
      ip: req.ip,
    });
    return res.status(500).json({ message: 'Server error while authenticating' });
  }
};

module.exports = { protect };
