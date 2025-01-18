const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/ApiResponse');
const STATUS_CODES = require('../constants/StatusCode');
const STATUS_MESSAGES = require('../constants/Message');
const logger = require('../utils/Logger');

const generateAccessToken = (id) => {
    logger.info('Generating access token', { userId: id });
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m'
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
        if (!user || !(await user.comparePassword(password))) {
            logger.warn('Login failed: Invalid credentials', { email });
            return res.status(401).json(apiResponse.error('Invalid email or password', STATUS_CODES.UNAUTHORIZED, null ));
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
        res.cookie('accesToken', accessToken,{
            httpOnly:true
        });

        logger.info('Access token refreshed successfully', { userId: user._id });
        res.json({ accessToken });
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

module.exports = { login, refresh, logout };