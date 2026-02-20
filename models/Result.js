const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    grade: {
        type: String
    },
    semester: {
        type: String
    },
    session: {
        type: String
    }
});

module.exports = mongoose.model('Result', resultSchema);
