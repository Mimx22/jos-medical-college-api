const Student = require('../models/Student');
// const bcrypt = require('bcryptjs'); // Removed for plain-text
const sendEmail = require('../utils/sendEmail');

// @desc    Get all applications
// @route   GET /api/admin/applications
// @access  Private/Admin
const getApplications = async (req, res) => {
    try {
        const students = await Student.find({}).sort({ dateApplied: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update application status
// @route   PUT /api/admin/applications/:id/status
// @access  Private/Admin
const updateApplicationStatus = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (student) {
            const oldStatus = student.admissionStatus;
            student.admissionStatus = req.body.status;

            if (req.body.status === 'Approved' && oldStatus !== 'Approved') {
                // Generate Student ID if not already (or regenerate)
                if (!student.studentId || student.studentId.startsWith('PENDING')) {
                    const year = new Date().getFullYear();
                    const random = Math.floor(Math.random() * 900 + 100);
                    student.studentId = `JMC/${year}/${random}`;
                }

                // Generate 5-digit temporary password
                const tempPassword = Math.floor(10000 + Math.random() * 90000).toString();
                student.password = tempPassword; // Plain text

                // Send Email
                const message = `
                    <h1>Admission Approved</h1>
                    <p>Dear ${student.fullName},</p>
                    <p>Congratulations! Your application to Jos Medical College has been approved.</p>
                    <p><strong>Your Login Credentials:</strong></p>
                    <ul>
                        <li><strong>Student ID:</strong> ${student.studentId}</li>
                        <li><strong>Temporary Password:</strong> ${tempPassword}</li>
                    </ul>
                    <p>Please login at the <a href="https://medicalcareer.netlify.app/student-login.html">Student Portal</a> and change your password immediately.</p>
                `;

                try {
                    await sendEmail({
                        email: student.email,
                        subject: 'Admission Approved - Jos Medical College',
                        message
                    });
                } catch (emailErr) {
                    console.error('Email failed to send:', emailErr.message);
                }
            }

            const updatedStudent = await student.save();
            res.json(updatedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const total = await Student.countDocuments();
        const pending = await Student.countDocuments({ admissionStatus: 'Pending' });
        const approved = await Student.countDocuments({ admissionStatus: 'Approved' });

        res.json({ total, pending, approved });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getApplications,
    updateApplicationStatus,
    getStats
};
