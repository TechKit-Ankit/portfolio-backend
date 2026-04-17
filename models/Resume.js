const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    public_id: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
