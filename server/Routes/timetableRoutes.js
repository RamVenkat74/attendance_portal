const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
    getTimetableByCourse,
    createOrUpdateTimetable,
} = require('../Controllers/timetableController');

const router = Router();

// Protect all timetable routes
router.use(protect);

router.route('/')
    .post(createOrUpdateTimetable); // POST /api/timetables

router.route('/:courseId')
    .get(getTimetableByCourse); // GET /api/timetables/60c72b2f...

module.exports = router;
