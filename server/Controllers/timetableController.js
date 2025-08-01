const asyncHandler = require('express-async-handler');
const Timetable = require('../Models/timetableModel');
const Course = require('../Models/courseModel');

/**
 * @desc    Get timetable for a specific course
 * @route   GET /api/timetables/:courseId
 * @access  Private
 */
const getTimetableByCourse = asyncHandler(async (req, res) => {
    const timetable = await Timetable.findOne({ course: req.params.courseId });

    if (timetable) {
        res.status(200).json(timetable);
    } else {
        // It's not an error if a timetable doesn't exist yet, so we send a 404
        res.status(404).json({ message: 'No timetable found for this course.' });
    }
});

/**
 * @desc    Create or update a timetable for a course
 * @route   POST /api/timetables
 * @access  Private
 */
const createOrUpdateTimetable = asyncHandler(async (req, res) => {
    const { course, timetable } = req.body;

    if (!course || !timetable) {
        res.status(400);
        throw new Error('Course ID and timetable data are required.');
    }

    // Use findOneAndUpdate with upsert:true to either create or update the document
    const updatedTimetable = await Timetable.findOneAndUpdate(
        { course: course }, // Find by the course ObjectId
        { timetable: timetable }, // The data to set
        { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(updatedTimetable);
});

module.exports = {
    getTimetableByCourse,
    createOrUpdateTimetable,
};
