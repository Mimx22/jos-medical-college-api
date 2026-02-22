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
const connectDB = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout for selection
            connectTimeoutMS: 10000,       // 10 seconds timeout for initial connection
        });
        console.log('🍃 MongoDB Connected Successfully');
    } catch (err) {
        lastDbError = err.message;
        console.error('❌ MongoDB Connection Error:', err.message);
        if (err.name === 'MongooseServerSelectionError') {
            console.error('👉 Tip: Check if your IP is whitelisted in MongoDB Atlas.');
        }
    }
};

connectDB();

// New Health Check Endpoint (Detailed)
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.status(200).json({
        status: 'UP',
        database: dbStatus,
        db_error: lastDbError,
        mongo_uri_present: !!process.env.MONGO_URI,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

const PORT = process.env.PORT || 5000;

// Important: Do not block for Serverless (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
