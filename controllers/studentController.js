const Student = require('../models/Student');
const Result = require('../models/Result');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new student
// @route   POST /api/students/register
// @access  Public
const registerStudent = async (req, res) => {
    const { fullName, email, phone, program, password } = req.body;

    try {
        const userExists = await Student.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Hash password (if not just using simple logic for now, but best correct)
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);
        // For now, storing plain text as per "mock" transition ease, OR hashed. 
        // Let's do hashed for security best practice.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const student = await Student.create({
            fullName,
            email,
            phone,
            program,
            password: hashedPassword,
            studentId: 'PENDING-' + Date.now().toString().slice(-6) // Temp ID
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
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth student & get token
// @route   POST /api/students/login
// @access  Public
const loginStudent = async (req, res) => {
    const { email, studentId, password } = req.body;
    const identifier = email || studentId;

    try {
        // Find by Email OR Student ID
        const student = await Student.findOne({
            $or: [{ email: identifier }, { studentId: identifier }]
        });

        if (student && (await bcrypt.compare(password, student.password))) {
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
