const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        RegNo: {
            type: String,
            required: [true, 'Register number is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        StdName: {
            type: String,
            required: [true, 'Student name is required'],
        },
    },
    {
        timestamps: true,
    }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
