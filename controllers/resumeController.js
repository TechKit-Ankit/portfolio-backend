const Resume = require('../models/Resume');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder, resourceType = 'auto', originalName) => {
    return new Promise((resolve, reject) => {
        const options = { folder, resource_type: resourceType };
        
        // If an original name is provided, use it as the public ID so the file URL preserves the exact name
        if (originalName) {
            options.public_id = originalName;
        }

        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Get resume (Public)
exports.getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne().sort({ createdAt: -1 });

        if (!resume) {
            return res.json({ url: null, message: 'No resume uploaded yet' });
        }

        res.json({
            url: resume.url,
            originalName: resume.originalName
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Download resume with the original uploaded filename
exports.downloadResume = async (req, res) => {
    try {
        const resume = await Resume.findOne().sort({ createdAt: -1 });

        if (!resume?.url) {
            return res.status(404).json({ message: 'No resume uploaded yet' });
        }

        const response = await fetch(resume.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch resume file: ${response.status}`);
        }

        const fileBuffer = Buffer.from(await response.arrayBuffer());
        const originalName = resume.originalName || 'resume.pdf';
        const asciiFileName = originalName.replace(/[^\x20-\x7E]+/g, '_').replace(/"/g, '');
        const utf8FileName = encodeURIComponent(originalName);

        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/pdf');
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${asciiFileName}"; filename*=UTF-8''${utf8FileName}`
        );
        res.setHeader('Cache-Control', 'no-store');

        res.send(fileBuffer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Upload/Update resume (Admin)
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Resume file is required' });
        }

        // Check if resume already exists (get ALL existing ones to ensure clean state)
        const existingResumes = await Resume.find();

        // If exists, delete old files from Cloudinary and DB
        for (const existingResume of existingResumes) {
            if (existingResume.public_id) {
                await cloudinary.uploader.destroy(existingResume.public_id, { resource_type: 'image' }).catch(() => {});
            }
            await Resume.findByIdAndDelete(existingResume._id);
        }

        // Upload new resume to Cloudinary, preserving the original uploaded filename
        let originalName = req.file.originalname;
        
        // Sanitize the filename for Cloudinary public_id (remove ? & # \ % < > characters)
        const sanitizedDataName = originalName.replace(/[?&#\\%<>]/g, '_');
        
        const result = await uploadToCloudinary(req.file.buffer, 'portfolio/resume', 'image', sanitizedDataName);

        // Save to database
        const resume = await Resume.create({
            public_id: result.public_id,
            url: result.secure_url,
            originalName: originalName,
        });

        res.json({ message: 'Resume uploaded successfully', resume });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete resume (Admin)
exports.deleteResume = async (req, res) => {
    try {
        const resumes = await Resume.find();

        if (!resumes || resumes.length === 0) {
            return res.status(404).json({ message: 'No resume found to delete' });
        }

        // Delete all dangling resumes from Cloudinary and DB
        for (const resume of resumes) {
            if (resume.public_id) {
                await cloudinary.uploader.destroy(resume.public_id, { resource_type: 'image' }).catch(() => {});
            }
            await Resume.findByIdAndDelete(resume._id);
        }

        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
