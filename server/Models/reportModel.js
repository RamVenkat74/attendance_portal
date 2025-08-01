const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        hr: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        freeze: {
            type: Boolean,
            default: false,
        },
        isExpired: {
            type: Boolean,
            default: false,
        },
        attendance: [
            {
                _id: false,
                student: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Student',
                    required: true,
                },
                status: {
                    type: Number,
                    required: true,
                    enum: [1, -1, 2], // 1: Present, -1: Absent, 2: On-Duty
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

reportSchema.index({ course: 1, date: 1, hr: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
