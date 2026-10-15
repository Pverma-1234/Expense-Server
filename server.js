
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');



const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const paymentsRoutes = require('./src/routes/paymentsRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const settlementRoutes = require('./src/routes/settlementRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');


const app = express();




const mongoUri =
    process.env.MONGO_DB_CONNECTION_URI ||
    process.env.Mongo_DB_CONNECTION_URI ||
    'mongodb://localhost:27017/Expense-App';

mongoose
    .connect(mongoUri, {
        serverSelectionTimeoutMS: 2000
    })
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch((error) => {
        console.log(
            'MongoDB not available, continuing in in-memory mode:',
            error.message
        );
    });



// const allowedOrigins = [
//     'http://localhost:5173',
//     'http://localhost:5174',
//     'http://localhost:5175',
//     'http://127.0.0.1:5173',
//     'http://127.0.0.1:5174',
//     'http://127.0.0.1:5175'
// ];

// if (process.env.CLIENT_URL) {
//     allowedOrigins.push(process.env.CLIENT_URL);
// }

// const corsOptions = {

//     origin: (origin, callback) => {

        
//         if (!origin) {
//             return callback(null, true);
//         }

//         if (allowedOrigins.includes(origin)) {
//             return callback(null, true);
//         }

//         return callback(
//             new Error(`CORS: Origin ${origin} is not allowed`)
//         );
//     },

//     credentials: true,

//     methods: [
//         'GET',
//         'POST',
//         'PUT',
//         'PATCH',
//         'DELETE',
//         'OPTIONS'
//     ],

//     allowedHeaders: [
//         'Content-Type',
//         'Authorization'
//     ]
// };


const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'https://expense-react-client-two.vercel.app',
    'https://expense-react-client-ivn9vcffc.vercel.app'
];

if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.error('CORS blocked origin:', origin);
        return callback(new Error(`CORS: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// app.use(cors(corsOptions));

// Apply CORS
app.use(cors(corsOptions));




app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(cookieParser());




app.use((request, response, next) => {

    console.log(
        'request',
        request.method,
        request.path
    );

    next();
});




app.get(
    '/.well-known/appspecific/com.chrome.devtools.json',
    (request, response) => {

        response.status(200).json({});
    }
);




app.get('/ping-test-123', (request, response) => {

    response.send('PONG_NEW_SERVER');
});




app.use('/auth', authRoutes);

app.use('/groups', groupRoutes);

app.use('/users', rbacRoutes);

app.use('/payments', paymentsRoutes);

app.use('/profile', profileRoutes);
app.use('/expenses', expenseRoutes);
app.use('/settlements', settlementRoutes);
app.use('/analytics', analyticsRoutes);



app.use((request, response) => {

    response.status(404).json({
        message: 'Route not found'
    });
});




app.use((error, request, response, next) => {

    console.error(
        'Unhandled server error:',
        error
    );

    response.status(500).json({
        message: 'Internal server error'
    });
});




const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {

    console.log(
        `Server is running on port ${PORT}`
    );
});