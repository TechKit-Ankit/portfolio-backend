const express = require('express');
const router = express.Router();
const { getResume, downloadResume, uploadResume, deleteResume } = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route
router.get('/', getResume);
router.get('/download', downloadResume);

// Protected routes (Admin only)
router.post('/', authMiddleware, upload.single('resume'), uploadResume);
router.delete('/', authMiddleware, deleteResume);

module.exports = router;
