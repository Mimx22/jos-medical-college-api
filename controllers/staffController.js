const Staff = require('../models/Staff');
const Course = require('../models/Course');
const Result = require('../models/Result');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth staff & get token
// @route   POST /api/staff/login
// @access  Public
const loginStaff = async (req, res) => {
    const { email, staffId, password } = req.body;
    const identifier = email || staffId;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Please provide both an identifier and a password' });
    }

    try {
        const staff = await Staff.findOne({
            $or: [{ email: identifier }, { staffId: identifier }]
        });

        // Secure bcrypt check
        const isMatch = (staff && staff.password && typeof password === 'string' && typeof staff.password === 'string')
            ? await bcrypt.compare(password, staff.password)
            : false;

        if (staff && isMatch) {
            res.json({
                _id: staff._id,
                fullName: staff.fullName,
                email: staff.email,
                staffId: staff.staffId,
                department: staff.department,
                token: generateToken(staff._id)
            });
        } else if (staff && staff.password === password) {
            // Fallback for temp passwords
            res.json({
                _id: staff._id,
                fullName: staff.fullName,
                email: staff.email,
                staffId: staff.staffId,
                department: staff.department,
                token: generateToken(staff._id),
                isTempPassword: true
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get staff profile
// @route   GET /api/staff/me
// @access  Private
const getStaffProfile = async (req, res) => {
    const staff = await Staff.findById(req.user._id).select('-password');
    if (staff) {
        res.json(staff);
    } else {
        res.status(404).json({ message: 'Staff not found' });
    }
};

// @desc    Update staff profile
// @route   PUT /api/staff/profile
// @access  Private
const updateStaffProfile = async (req, res) => {
    const staff = await Staff.findById(req.user._id);

    if (staff) {
        staff.phone = req.body.phone || staff.phone;
        // Add other fields as needed

        const updatedStaff = await staff.save();
        res.json({
            _id: updatedStaff._id,
            fullName: updatedStaff.fullName,
            email: updatedStaff.email,
            staffId: updatedStaff.staffId,
            department: updatedStaff.department,
            token: generateToken(updatedStaff._id)
        });
    } else {
        res.status(404).json({ message: 'Staff not found' });
    }
};

// @desc    Get assigned courses
// @route   GET /api/staff/courses
// @access  Private
const getStaffCourses = async (req, res) => {
    // Assuming Course model has assignedStaff field
    // But better to query Course model where assignedStaff == req.user._id
    // But current Course schema reference assignedStaff
    try {
        const courses = await Course.find({ assignedStaff: req.user._id });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enter Results Manually
// @route   POST /api/staff/results/entry
// @access  Private
const enterManualResult = async (req, res) => {
    const { studentId, courseCode, score } = req.body;

    try {
        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ message: 'Student ID not found' });

        const course = await Course.findOne({ code: courseCode });
        if (!course) return res.status(404).json({ message: 'Course Code not found' });

        // Check if result exists, update or create
        let result = await Result.findOne({ student: student._id, course: course._id });

        if (result) {
            result.score = score;
            // Calculate grade logic here if needed
            result.grade = score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 45 ? 'D' : 'F';
            await result.save();
        } else {
            result = await Result.create({
                student: student._id,
                course: course._id,
                score,
                grade: score >= 70 ? 'A' : score >= 60 ? 'B' : score >= 50 ? 'C' : score >= 45 ? 'D' : 'F',
                session: '2026/2027' // Default or passed in body
            });
        }

        res.json({ message: 'Result saved successfully', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    loginStaff,
    getStaffProfile,
    updateStaffProfile,
    getStaffCourses,
    enterManualResult
};
