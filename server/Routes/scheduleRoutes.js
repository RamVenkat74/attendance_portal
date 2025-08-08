// server/Routes/scheduleRoutes.js

const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
    getScheduleForCourse,
    addScheduleSlot,
    deleteScheduleSlot,
} = require('../Controllers/scheduleController');

const router = Router();

// Protect all routes in this file
router.use(protect);

router.route('/')
    .post(addScheduleSlot); // Add a new slot

router.route('/:courseId')
    .get(getScheduleForCourse); // Get all slots for a course

router.route('/:slotId')
    .delete(deleteScheduleSlot); // Delete a specific slot by its ID

module.exports = router;