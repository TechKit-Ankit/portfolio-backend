const express = require('express');
const router = express.Router();
const {
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route
router.get('/', getAllProjects);

// Protected routes (Admin only)
router.post('/', authMiddleware, upload.single('image'), createProject);
router.put('/:id', authMiddleware, upload.single('image'), updateProject);
router.delete('/:id', authMiddleware, deleteProject);

module.exports = router;
