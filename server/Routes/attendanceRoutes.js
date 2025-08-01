const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
	updateAttendance,
	fetchData,
	studentDashboard,
	unmarkedAttendanceHours,
	getRecordsByCourse,
	unlockRecord,
	deleteRecordById,
	getClassReport
} = require('../Controllers/AttendanceController');

const router = Router();

router.use(protect);

// --- Attendance Record Management ---
router.post('/records', updateAttendance);
router.get('/records/:courseId', getRecordsByCourse);
router.patch('/records/:id/unlock', unlockRecord);
router.delete('/records/:id', deleteRecordById);

// --- Data Fetching & Reporting ---
router.post('/data', fetchData);
router.post('/dashboard', studentDashboard);
router.post('/reports/class', getClassReport);
router.post('/unmarked', unmarkedAttendanceHours);

module.exports = router;
