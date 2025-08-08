// server/Models/scheduleModel.js

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        day: {
            type: String,
            required: true,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        hour: {
            type: Number,
            required: true,
            min: 1,
            max: 8,
        },
        batch: {
            type: Number,
            enum: [1, 2], // Only allows 1 or 2. Set to null or omit for theory classes.
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate slots (same course, day, hour, and batch)
scheduleSchema.index({ course: 1, day: 1, hour: 1, batch: 1 }, { unique: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;