// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { responseHandler } = require('./middleware/ResponseHandler')
const { protect } = require('./middleware/AuthMiddleware')
const authRoutes = require('./routes/AuthRoutes');
const userRoutes = require('./routes/UserRoutes')

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(responseHandler);
app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true,
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/user', protect, userRoutes )

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));