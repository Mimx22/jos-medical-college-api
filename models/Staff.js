const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String
    },
    staffId: {
        type: String,
        unique: true
    },
    department: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'staff'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

module.exports = mongoose.model('Staff', staffSchema);
