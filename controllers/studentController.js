const Student = require('../models/Student');
const Result = require('../models/Result');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Removed for plain-text

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new student
// @route   POST /api/students/register
// @access  Public
const registerStudent = async (req, res) => {
    // Log for debugging (especially helpful on Render logs)
    console.log('--- Registration Attempt ---');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);

    const { fullName, email, phone, program } = req.body;

    // Ensure password is not undefined (from FormData or otherwise)
    const password = req.body.password || 'password123';

    try {
        if (!email) {
            console.error('Registration failed: Email is missing from request body');
            return res.status(400).json({ message: 'Email is required' });
        }

        const userExists = await Student.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        if (!password) {
            console.error('Registration failed: Password is missing');
            return res.status(400).json({ message: 'Password is required' });
        }

        const hashedPassword = password; // Using plain text

        const documents = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const student = await Student.create({
            fullName,
            email,
            phone,
            program,
            password: hashedPassword, // Stored as plain text temporarily
            studentId: 'PENDING-' + Date.now().toString().slice(-6), // Temp ID
            documents
        });

        if (student) {
            res.status(201).json({
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                token: generateToken(student._id)
            });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: error.message || 'Server error during registration' });
    }
};

// @desc    Auth student & get token
// @route   POST /api/students/login
// @access  Public
const loginStudent = async (req, res) => {
    const { email, studentId, password } = req.body;
    const identifier = email || studentId;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Please provide both an identifier and a password' });
    }

    try {
        // Find by Email OR Student ID
        const student = await Student.findOne({
            $or: [{ email: identifier }, { studentId: identifier }]
        });

        console.log(`--- Student Login Attempt: ${identifier} ---`);

        // Check password directly (Plain text)
        const isMatch = (student && student.password && password === student.password);

        if (student && isMatch) {
            res.json({
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                studentId: student.studentId,
                program: student.program,
                profilePic: student.profilePic,
                token: generateToken(student._id)
            });
        } else if (student && student.password === password) {
            // Plain text fallback
            res.json({
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                studentId: student.studentId,
                program: student.program,
                profilePic: student.profilePic,
                token: generateToken(student._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student profile
// @route   GET /api/students/me
// @access  Private
const getStudentProfile = async (req, res) => {
    const student = await Student.findById(req.user._id).select('-password');
    if (student) {
        res.json(student);
    } else {
        res.status(404).json({ message: 'Student not found' });
    }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private
const updateStudentProfile = async (req, res) => {
    const student = await Student.findById(req.user._id);

    if (student) {
        student.email = req.body.email || student.email;
        student.phone = req.body.phone || student.phone;
        if (req.body.profilePic) {
            student.profilePic = req.body.profilePic;
        }
        // Password update logic could go here too

        const updatedStudent = await student.save();
        res.json({
            _id: updatedStudent._id,
            fullName: updatedStudent.fullName,
            email: updatedStudent.email,
            studentId: updatedStudent.studentId,
            program: updatedStudent.program,
            profilePic: updatedStudent.profilePic,
            token: generateToken(updatedStudent._id)
        });
    } else {
        res.status(404).json({ message: 'Student not found' });
    }
};

module.exports = {
    registerStudent,
    loginStudent,
    getStudentProfile,
    updateStudentProfile
};
