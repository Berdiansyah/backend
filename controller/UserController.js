const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/ApiResponse')
const STATUS_CODES = require('../constants/StatusCode')
const STATUS_MESSAGES = require('../constants/Message')

const register = async (req, res) => {
  try {
      const { email, password, name, role } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
          return res.status(400).json(apiResponse.error('User already exists',STATUS_CODES.BAD_REQUEST,null));
      }

      const user = await User.create({
          email,
          password,
          name,
          role
      });

      const data = {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
      }

      res.status(201).json(apiResponse.success(STATUS_MESSAGES[200] ,STATUS_CODES.OK,data));
  } catch (error) {
      res.status(500).json(apiResponse.error(error.message,STATUS_CODES.INTERNAL_SERVER_ERROR,null));
  }
};

const getAllUsers = async (req, res) => {
  try {
  
    // Ambil semua user dari database
    const users = await User.find().select('-password'); // Jangan sertakan password

    res.status(200).json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK,users));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const token = req.cookies.accessToken; // Ambil JWT dari cookies
    if (!token) {
      return res
        .status(401)
        .json(apiResponse.error('Access token is missing', STATUS_CODES.UNAUTHORIZED, null));
    }

    // Verifikasi token JWT
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        // Token invalid atau expired
        if (err.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json(apiResponse.error('Access token has expired', STATUS_CODES.UNAUTHORIZED, null));
        }
        return res
          .status(401)
          .json(apiResponse.error('Invalid access token', STATUS_CODES.UNAUTHORIZED, null));
      }

      // Token valid, ambil data pengguna dari database
      const user = await User.findById(decoded._id).select('-password'); // Hindari mengembalikan password
      if (!user) {
        return res
          .status(404)
          .json(apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null));
      }

      res.status(200).json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, user));
    });
  } catch (error) {
    res
      .status(500)
      .json(apiResponse.error(error.message, STATUS_CODES.INTERNAL_SERVER_ERROR, null));
  }
};

const editUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validasi input
    if (!name && !email && !role) {
      return res.status(400).json(
        apiResponse.error('At least one field is required to update', STATUS_CODES.BAD_REQUEST, null)
      );
    }

    // Cari dan update user sekaligus
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name: name || undefined,
          email: email || undefined,
          role: role || undefined
        }
      },
      { 
        new: true,      // Mengembalikan dokumen yang sudah diupdate
        select: '-password' // Exclude password dari response
      }
    );

    if (!updatedUser) {
      return res.status(404).json(
        apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null)
      );
    }

    // Jika update email, cek apakah email sudah digunakan
    if (email && email !== updatedUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json(
          apiResponse.error('Email already in use', STATUS_CODES.BAD_REQUEST, null)
        );
      }
    }

    const userData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    };

    res.status(200).json(
      apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, userData)
    );

  } catch (error) {
    res.status(500).json(
      apiResponse.error(error.message, STATUS_CODES.INTERNAL_SERVER_ERROR, null)
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    // Cari user berdasarkan ID yang ada di JWT
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json(apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null));
    }

    // Hapus user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json(apiResponse.success('User deleted successfully', STATUS_CODES.OK, null));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {register, getUser, getAllUsers, deleteUser, editUser}