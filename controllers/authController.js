const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Removed for plain-text
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, studentId, password } = req.body;
    const identifier = email || studentId;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Please provide both an identifier and a password' });
    }

    console.log(`--- Login Attempt for: ${identifier} ---`);

    let user = await Student.findOne({
        $or: [{ email: identifier }, { studentId: identifier }]
    });
    let role = 'student';

    if (!user) {
        user = await Staff.findOne({
            $or: [{ email: identifier }, { staffId: identifier }]
        });
        role = 'staff';
    }

    // Admin Check (Mock for now, or create Admin model)
    if (email === 'admin@josmed.edu.ng' && password === 'adminpassword123') {
        return res.json({
            _id: 'admin',
            fullName: 'Admin',
            email: 'admin@josmed.edu.ng',
            role: 'admin',
            token: generateToken('admin'),
        });
    }

    // Secure check removed, using plain-text as requested
    const isMatch = (user && user.password && password === user.password);

    if (user && isMatch) {
        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: role,
            token: generateToken(user._id),
            // Add other necessary fields
            studentId: user.studentId,
            staffId: user.staffId,
            program: user.program,
            department: user.department,
            profilePic: user.profilePic
        });
    } else {
        // Fallback for temp passwords (plain text) - FROM MIGRATION ONLY
        if (user && user.password === password) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: role,
                token: generateToken(user._id),
                studentId: user.studentId,
                staffId: user.staffId,
                program: user.program,
                department: user.department,
                profilePic: user.profilePic,
                isTempPassword: true
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
};

// @desc    Register a new student (Public for now)
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
    const { fullName, email, phone, program, password } = req.body;

    const userExists = await Student.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    const student = await Student.create({
        fullName,
        email,
        phone,
        program,
        password: password, // Stored as plain text as requested
        admissionStatus: 'Pending'
    });

    if (student) {
        res.status(201).json({
            _id: student._id,
            fullName: student.fullName,
            email: student.email,
            token: generateToken(student._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await Student.findOne({ email }) || await Staff.findOne({ email });

        if (!user) {
            // For security, don't reveal if user exists
            return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

        await user.save();

        // Create reset URL
        // We use window.location.origin in frontend or a fixed URL
        const resetUrl = `${process.env.FRONTEND_URL || 'https://medicalcareer.netlify.app'}/reset-password.html?token=${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
            <p>Please click on the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>If you did not request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                message
            });

            res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    try {
        // Hash token from params
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user by token and see if it's expired
        const user = await Student.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        }) || await Staff.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password (Plain text as requested)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, registerStudent, forgotPassword, resetPassword };
