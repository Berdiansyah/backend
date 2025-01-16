const jwt = require('jsonwebtoken');
const User = require('../models/UserModels');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header Authorization

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expired, please log in again' });
        }
        return res.status(401).json({ message: 'Token verification failed' });
      }

      // Jika token valid, tambahkan data pengguna ke `req.user`
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
