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

const mongoUri = process.env.MONGO_DB_CONNECTION_URI || process.env.Mongo_DB_CONNECTION_URI || 'mongodb://localhost:27017/Expense-App';

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 })
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => {
        console.log('MongoDB not available, continuing in in-memory mode:', error.message);
    });


// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    process.env.CLIENT_URL || 'http://localhost:5175'
];

const corsOption = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin || 'http://localhost:5175');
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
const app = express();

app.use((request, response, next) => {
    if (request.method === 'OPTIONS') {
        const origin = request.headers.origin;
        const allowedOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:5175';
        response.header('Access-Control-Allow-Origin', allowedOrigin);
        response.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.header('Access-Control-Allow-Credentials', 'true');
        return response.sendStatus(204);
    }
    next();
});
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((request, response, next) => {
    console.log('request', request.method, request.path);
    next();
});

// Handle DevTools automatic probes
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(200).json({});
});
app.get('/ping-test-123', (req, res) => {
    res.send('PONG_NEW_SERVER');
});

// Routes
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/users', rbacRoutes);
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);

app.use((error, request, response, next) => {
    console.error('Unhandled server error', error);
    response.status(500).json({ message: 'Internal server error' });
});

// Server Start
app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
