const express = require('express');
const router = express.Router();
const {
    loginStaff,
    getStaffProfile,
    updateStaffProfile,
    getStaffCourses,
    enterManualResult
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginStaff);
router.route('/me').get(protect, getStaffProfile);
router.route('/profile').put(protect, updateStaffProfile);
router.route('/courses').get(protect, getStaffCourses);
router.route('/results/entry').post(protect, enterManualResult);

module.exports = router;
