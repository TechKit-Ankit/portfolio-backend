const express = require('express');
const router = express.Router();
const { login, createAdmin } = require('../controllers/authController');

// Admin login
router.post('/login', login);

// Create admin (use this once to create admin account)
router.post('/create-admin', createAdmin);

module.exports = router;
