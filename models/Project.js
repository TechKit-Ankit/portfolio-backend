const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    status: {
        type: String,
        enum: ['completed', 'in-progress', 'archived'],
        default: 'in-progress',
    },
    techStack: [{
        type: String,
    }],
    githubLink: {
        type: String,
    },
    hostedLink: {
        type: String,
    },
    isHosted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
