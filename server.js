const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://medicalcareer.netlify.app',
    'https://jos-medical-college.github.io' // Added just in case
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps/Postman) or allowed domains
        if (!origin || allowedOrigins.includes(origin)) {
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
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout
        });
        console.log('🍃 MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
