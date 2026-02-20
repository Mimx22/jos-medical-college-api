const express = require('express');
const router = express.Router();
const {
    getApplications,
    updateApplicationStatus,
    getStats
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware'); // Assuming admin middleware exists

router.get('/applications', protect, admin, getApplications);
router.put('/applications/:id/status', protect, admin, updateApplicationStatus);
router.get('/stats', protect, admin, getStats);

module.exports = router;
