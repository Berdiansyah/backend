const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/ApiResponse');
const STATUS_CODES = require('../constants/StatusCode');
const STATUS_MESSAGES = require('../constants/Message');
const logger = require('../utils/Logger')

// Log startup message to verify logger is working
logger.info('Logger initialized successfully');

const register = async (req, res) => {
  logger.info('Starting user registration process', { email: req.body.email });
  try {
    const { email, password, name, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn('Registration failed: User already exists', { email });
      return res.status(400).json(apiResponse.error('User already exists', STATUS_CODES.BAD_REQUEST, null));
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

    logger.info('User registered successfully', { userId: user._id, email: user.email });
    res.status(201).json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data));
  } catch (error) {
    logger.error('Error in user registration', { error: error.message, stack: error.stack });
    res.status(500).json(apiResponse.error(error.message, STATUS_CODES.INTERNAL_SERVER_ERROR, null));
  }
};

const getAllUsers = async (req, res) => {
  logger.info('Fetching all users');
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      logger.warn('Access token missing in request');
      return res
        .status(401)
        .json(apiResponse.error('Access token is missing', STATUS_CODES.UNAUTHORIZED, null));
    }

    const users = await User.find().select('-password');
    logger.info('Successfully retrieved all users', { count: users.length });
    res.status(200).json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, users));
  } catch (error) {
    logger.error('Error fetching all users', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  logger.info('Attempting to fetch user details');
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      logger.warn('Access token missing in request');
      return res
        .status(401)
        .json(apiResponse.error('Access token is missing', STATUS_CODES.UNAUTHORIZED, null));
    }

      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        logger.warn('User not found', { userId: decoded._id });
        return res
          .status(404)
          .json(apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null));
      }

      logger.info('User details retrieved successfully', { userId: user._id });
      res.status(200).json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, user));
  } catch (error) {
    logger.error('Error fetching user details', { error: error.message, stack: error.stack });
    res
      .status(500)
      .json(apiResponse.error(error.message, STATUS_CODES.INTERNAL_SERVER_ERROR, null));
  }
};

const editUser = async (req, res) => {
  logger.info('Starting user edit process', { userId: req.user._id });
  try {
    const { name, email, role } = req.body;

    if (!name && !email && !role) {
      logger.warn('Edit user failed: No fields provided for update', { userId: req.user._id });
      return res.status(400).json(
        apiResponse.error('At least one field is required to update', STATUS_CODES.BAD_REQUEST, null)
      );
    }

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
        new: true,
        select: '-password'
      }
    );

    if (!updatedUser) {
      logger.warn('User not found during edit', { userId: req.user._id });
      return res.status(404).json(
        apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null)
      );
    }

    if (email && email !== updatedUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        logger.warn('Edit user failed: Email already in use', { email });
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

    logger.info('User updated successfully', { userId: updatedUser._id });
    res.status(200).json(
      apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, userData)
    );

  } catch (error) {
    logger.error('Error updating user', { error: error.message, stack: error.stack, userId: req.user._id });
    if(error.codeName == "DuplicateKey"){
      return res.status(500).json(
        apiResponse.error("Email yang dimasukan sudah terdaftar", STATUS_CODES.INTERNAL_SERVER_ERROR, null)
      );
    }else{
      return res.status(500).json(
        apiResponse.error("Terjadi kesalahan saat mengupdate data", STATUS_CODES.INTERNAL_SERVER_ERROR, null)
      );
    }
  }
};

const changePassword = async (req, res) => {
  logger.info('Starting password change process', { userId: req.user._id });
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user and verify current password
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn('Password change failed: User not found', { userId: req.user._id });
      return res.status(404).json(
        apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null)
      );
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      logger.warn('Password change failed: Current password incorrect');
      return res.status(400).json(
        apiResponse.error('Current password is incorrect', STATUS_CODES.BAD_REQUEST, null)
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', { userId: user._id });
    res.status(200).json(
      apiResponse.success('Password changed successfully', STATUS_CODES.OK, null)
    );

  } catch (error) {
    logger.error('Error changing password', { 
      error: error.message, 
      stack: error.stack, 
      userId: req.user._id 
    });
    res.status(500).json(
      apiResponse.error('Error changing password', STATUS_CODES.INTERNAL_SERVER_ERROR, null)
    );
  }
};

const deleteUser = async (req, res) => {
  logger.info('Starting user deletion process', { userId: req.body._id });
  try {
    const user = await User.findById(req.body._id);

    if (!user) {
      logger.warn('Delete user failed: User not found', { userId: req.body._id });
      return res.status(404).json(apiResponse.error('User not found', STATUS_CODES.NOT_FOUND, null));
    }

    await User.findByIdAndDelete(req.body._id);
    
    logger.info('User deleted successfully', { userId: req.body._id });
    res.status(200).json(apiResponse.success('User deleted successfully', STATUS_CODES.OK, null));
  } catch (error) {
    logger.error('Error deleting user', { error: error.message, stack: error.stack, userId: req.body._id });
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, getUser, getAllUsers, deleteUser, editUser, changePassword };