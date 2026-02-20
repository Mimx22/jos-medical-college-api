const express = require('express');
const router = express.Router();
const { loginUser, registerStudent } = require('../controllers/authController');

router.post('/login', loginUser);
// router.post('/register', registerStudent); // Moved to studentRoutes as Apply, or keep here for generic auth

module.exports = router;
