const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Ensure uploads directory exists
// Ensure uploads directory exists (Graceful for Serverless)
const uploadDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
} catch (err) {
    console.warn('Could not create uploads directory (Serverless Read-Only):', err.message);
}

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://medicalcareer.netlify.app',
    'https://www.medicalcareer.netlify.app',
    'https://jos-medical-college.github.io'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin or allowed domains or any netlify subdomain
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
            callback(null, true);
        } else {
            console.warn(`[CORS Blocked] Origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to ensure DB is connected before handling API requests
app.use(async (req, res, next) => {
    // Skip health check to avoid recursion if it calls connectDB itself
    if (req.path.startsWith('/api') && req.path !== '/api/health') {
        try {
            await connectDB();
            next();
        } catch (err) {
            return res.status(503).json({
                message: 'Database connection in progress or failed. Please refresh.',
                error: err.message
            });
        }
    } else {
        next();
    }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root path for health check
app.get('/', (req, res) => {
    res.status(200).send('JMC API is live and healthy');
});

// Database Connection
let lastDbError = null;
let dbPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        try {
            console.log('⏳ Connecting to MongoDB...');
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
            });
            console.log('🍃 MongoDB Connected Successfully');
            lastDbError = null;
            return conn;
        } catch (err) {
            lastDbError = err.message;
            dbPromise = null; // Reset promise so we can retry
            console.error('❌ MongoDB Connection Error:', err.message);
            if (err.name === 'MongooseServerSelectionError') {
                console.error('👉 Tip: Check if your IP is whitelisted in MongoDB Atlas.');
            }
            throw err;
        }
    })();

    return dbPromise;
};

// Initial connection attempt (background)
connectDB().catch(() => { });

// New Health Check Endpoint (Detailed)
app.get('/api/health', async (req, res) => {
    try {
        await connectDB();
    } catch (err) {
        // Error already captured in lastDbError
    }

    const stateMap = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    const readyState = mongoose.connection.readyState;
    const dbStatus = stateMap[readyState] || 'Unknown';

    // Mask the URI for safe verification
    let maskedUri = 'Not Present';
    if (process.env.MONGO_URI) {
        maskedUri = process.env.MONGO_URI.replace(/:([^@\s]+)@/, ':****@');
    }

    res.status(200).json({
        status: 'UP',
        database: dbStatus,
        readyState: readyState,
        db_error: lastDbError,
        mongo_uri_present: !!process.env.MONGO_URI,
        uri_preview: maskedUri,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

const PORT = process.env.PORT || 5000;

// Important: Do not block for Serverless (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
