// server/Controllers/scheduleController.js

const asyncHandler = require('express-async-handler');
const Schedule = require('../Models/scheduleModel');
const Course = require('../Models/courseModel');

// @desc    Get all schedule slots for a course
// @route   GET /api/schedules/:courseId
const getScheduleForCourse = asyncHandler(async (req, res) => {
    const scheduleSlots = await Schedule.find({ course: req.params.courseId }).sort({ day: 1, hour: 1 });
    res.status(200).json(scheduleSlots);
});

// @desc    Add a new schedule slot
// @route   POST /api/schedules
const addScheduleSlot = asyncHandler(async (req, res) => {
    const { courseId, day, hour, batch } = req.body;

    if (!courseId || !day || !hour) {
        res.status(400);
        throw new Error('Course, day, and hour are required.');
    }

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found.');
    }

    // For non-lab courses, batch should be null
    const slotData = {
        course: courseId,
        day,
        hour,
        batch: course.isLab ? batch : null,
    };

    const newSlot = await Schedule.create(slotData);
    res.status(201).json(newSlot);
});

// @desc    Delete a schedule slot
// @route   DELETE /api/schedules/:slotId
const deleteScheduleSlot = asyncHandler(async (req, res) => {
    const slot = await Schedule.findById(req.params.slotId);
    if (!slot) {
        res.status(404);
        throw new Error('Schedule slot not found.');
    }
    await Schedule.deleteOne({ _id: req.params.slotId });
    res.status(200).json({ message: 'Slot deleted successfully.' });
});

module.exports = {
    getScheduleForCourse,
    addScheduleSlot,
    deleteScheduleSlot,
};