const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/ApiResponse')
const STATUS_CODES = require('../constants/StatusCode')
const STATUS_MESSAGES = require('../constants/Message')

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign(
        { 
            id,
            version: Date.now() // Add a timestamp as version to enable token invalidation if needed
        }, 
        process.env.REFRESH_TOKEN_SECRET, 
        {
            expiresIn: '1d'
        }
    );
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json(apiResponse.error('Invalid email or password', STATUS_CODES.UNAUTHORIZED, null ));
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        //untuk menset refreshToken di dalam cookie 
        res.cookie('accessToken', accessToken,{
            httpOnly:true
        })
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        const data = {
                _id: user._id,
                accessToken
            }

        res.json(apiResponse.success(STATUS_MESSAGES[200],STATUS_CODES.OK, data))
    } catch (error) {
        res.status(500).json(apiResponse.error( error.message , 500, null));
    }
};

const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json(apiResponse.error('Refresh token not found',STATUS_CODES.UNAUTHORIZED, null));
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) {'User not found'
            return res.status(403).json(apiResponse.error('User not found', STATUS_CODES.FORBIDDEN, null));
        }

        const accessToken = generateAccessToken(user._id);
        res.cookie('accesToken', accessToken,{
            httpOnly:true
        })
        res.json({ accessToken });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(403).json(apiResponse.error('Refresh token expired', STATUS_CODES.FORBIDDEN, null));
        }
        res.status(403).json(apiResponse.error('Invalid refresh token', STATUS_CODES.FORBIDDEN, null));
    }
};

const logout = async (req, res) => {
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
    
    res.json(apiResponse.success('Logged out successfully', STATUS_CODES.OK, null));
};

module.exports = { login, refresh, logout };