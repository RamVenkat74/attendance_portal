const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
	updateAttendance,
	fetchData,
	studentDashboard,
	unmarkedAttendanceHours,
	deleteRecord,
	getRecordsByCourse, // Import the new function
} = require('../Controllers/AttendanceController');

const router = Router();

// Apply authentication middleware to all routes in this file for security
router.use(protect);

// --- Attendance Record Management ---

// POST /api/attendance/records - Create or update attendance for a session
router.post('/records', updateAttendance);

// DELETE /api/attendance/records - Delete a specific attendance record
router.delete('/records', deleteRecord);

// GET /api/attendance/records/:courseId - Get all records for a specific course
router.get('/records/:courseId', getRecordsByCourse);


// --- Data Fetching & Reporting ---

// POST /api/attendance/data - Fetch initial student data for marking attendance
router.post('/data', fetchData);

// POST /api/attendance/dashboard - Generate a detailed report for a class or student
router.post('/dashboard', studentDashboard);

// POST /api/attendance/unmarked - Get a list of unmarked attendance hours
router.post('/unmarked', unmarkedAttendanceHours);


module.exports = router;
