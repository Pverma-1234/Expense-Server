require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const paymentsRoutes = require('./src/routes/paymentsRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();

// Database Connection
mongoose.connect(process.env.MONGO_DB_CONNECTION_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => console.log('Error Connecting to Database: ', error));

// Middleware
const corsOption = {
    origin: process.env.CLIENT_URL,
    credentials: true
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/users', rbacRoutes);
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);

// Server Start
app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
