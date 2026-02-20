const Student = require('../models/Student');

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
            student.admissionStatus = req.body.status;

            if (req.body.status === 'Approved') {
                // Generate Student ID if not already (or regenerate)
                if (student.studentId.startsWith('PENDING')) {
                    const year = new Date().getFullYear();
                    const random = Math.floor(Math.random() * 900 + 100);
                    student.studentId = `JMC/${year}/${random}`;
                }
            } else if (req.body.status === 'Rejected') {
                // Keep PENDING ID or clear? Keep for record.
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
