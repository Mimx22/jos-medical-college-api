const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Staff = require('../models/Staff');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.id === 'admin') {
                req.user = { _id: 'admin', role: 'admin', email: 'admin@josmed.edu.ng' };
            } else {
                // Check if user is student
                req.user = await Student.findById(decoded.id).select('-password');
                if (!req.user) {
                    // Check if user is staff
                    req.user = await Staff.findById(decoded.id).select('-password');
                }
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') { // You might need to add role to Student/Staff or have a separate Admin model
        next();
    } else {
        // Temporary: Allow if email matches admin (as per frontend)
        if (req.user.email === 'admin@josmed.edu.ng') {
            next();
        } else {
            res.status(401).json({ message: 'Not authorized as an admin' });
        }
    }
};

module.exports = { protect, admin };
