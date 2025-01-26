// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");

//Confif
const connectDB = require('./config/db');

//Middleware
const { responseHandler } = require('./middleware/ResponseHandler')
const { protect } = require('./middleware/AuthMiddleware')

//Routes
const authRoutes = require('./routes/AuthRoutes');
const userRoutes = require('./routes/UserRoutes')
const produkRoutes = require('./routes/ProdukRoutes')
const typePreferensiRoutes = require('./routes/TipePreferensi')
const kriteriaRoutes = require('./routes/KriteriaRoutes')
const subKriteriaRoutes = require('./routes/SubKriteriaRoutes')
const bobotSubKriteriaRoutes = require('./routes/BobotSubKriteriaRoutes')
const bobotProdukRoutes = require('./routes/BobotProdukRoutes')

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cookieParser());
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
// app.use('/user', userRoutes )

app.use('/produk', protect, produkRoutes )
app.use('/typePreferensi', protect, typePreferensiRoutes )
app.use('/kriteria' , protect, kriteriaRoutes )
app.use('/subKriteria' , protect, subKriteriaRoutes )
app.use('/bobotSubKriteria' , protect, bobotSubKriteriaRoutes )
app.use('/bobotProduk' , protect, bobotProdukRoutes )
// app.use('/produk', produkRoutes )
// app.use('/typePreferensi', typePreferensiRoutes )
// app.use('/kriteria' , kriteriaRoutes )
// app.use('/subKriteria' , subKriteriaRoutes )
// app.use('/bobotSubKriteria' , bobotSubKriteriaRoutes )
// app.use('/bobotProduk' , bobotProdukRoutes )

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));