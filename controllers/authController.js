const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Staff = require('../models/Staff');

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

    if (user && (await bcrypt.compare(password, user.password))) {
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
        fullName,
        email,
        phone,
        program,
        password: hashedPassword,
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

module.exports = { loginUser, registerStudent };
