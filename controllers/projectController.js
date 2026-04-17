const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Get all projects (Public)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
    }
};

// Create project (Admin)
exports.createProject = async (req, res) => {
    try {
        const { name, status, techStack, githubLink, hostedLink, isHosted } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Project image is required' });
        }

        // Upload image to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'portfolio/projects');

        // Parse techStack if it's a string
        const parsedTechStack = typeof techStack === 'string' ? JSON.parse(techStack) : techStack;

        const project = await Project.create({
            name,
            image: {
                public_id: result.public_id,
                url: result.secure_url,
            },
            status,
            techStack: parsedTechStack,
            githubLink,
            hostedLink,
            isHosted: isHosted === 'true' || isHosted === true,
        });

        res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update project (Admin)
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, techStack, githubLink, hostedLink, isHosted } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update fields
        if (name) project.name = name;
        if (status) project.status = status;
        if (techStack) {
            project.techStack = typeof techStack === 'string' ? JSON.parse(techStack) : techStack;
        }
        if (githubLink !== undefined) project.githubLink = githubLink;
        if (hostedLink !== undefined) project.hostedLink = hostedLink;
        if (isHosted !== undefined) project.isHosted = isHosted === 'true' || isHosted === true;

        // If new image is uploaded, delete old and upload new
        if (req.file) {
            // Delete old image from Cloudinary
            await cloudinary.uploader.destroy(project.image.public_id);

            // Upload new image
            const result = await uploadToCloudinary(req.file.buffer, 'portfolio/projects');
            project.image = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        await project.save();

        res.json({ message: 'Project updated successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete project (Admin)
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(project.image.public_id);

        // Delete project from database
        await Project.findByIdAndDelete(id);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
