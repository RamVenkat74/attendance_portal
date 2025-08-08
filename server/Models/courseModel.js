// server/Models/courseModel.js

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        coursename: {
            type: String,
            required: true,
        },
        coursecode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        faculty: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Admin',
                required: true,
            },
        ],
        class: {
            type: String,
            required: true,
        },
        dept: {
            type: String,
            required: true,
        },
        // --- NEW FIELD ---
        isLab: {
            type: Boolean,
            default: false,
        },
        // --- NEW FIELDS for batch-specific students ---
        batch1Students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
        batch2Students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

        // This will now store ALL students from both batches for a lab course
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;