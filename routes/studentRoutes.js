const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');
const {
    registerStudent,
    getStudentProfile,
    updateStudentProfile
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerStudent);
router.post('/login', loginUser);
router.route('/me').get(protect, getStudentProfile);
router.route('/profile').put(protect, updateStudentProfile);

module.exports = router;
