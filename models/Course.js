const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    unitLoad: {
        type: Number,
        default: 3
    },
    program: {
        type: String
    },
    assignedStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    }
});

module.exports = mongoose.model('Course', courseSchema);
