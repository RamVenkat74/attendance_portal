const { Router } = require('express');
const multer = require('multer');
const { protect } = require('../Middleware/middleware');

// Import the entire controller object
const facultyController = require('../Controllers/facultyController');

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication middleware to all routes in this file
router.use(protect);

// --- Main Faculty Routes ---

// GET /api/faculty/dashboard - Fetches a summary for the faculty's profile page
router.get('/dashboard', facultyController.getFacultyDashboard);

// POST /api/faculty/courses - Creates a new course and enrolls students from a CSV
router.route('/courses')
	.post(upload.single('file'), facultyController.createCourseWithStudents);

// DELETE /api/faculty/courses/:id - Deletes a course and all its associated data
router.route('/courses/:id')
	.delete(facultyController.deleteCourse);

// GET /api/faculty/courses/:id/students - Gets the list of students for a specific course
router.route('/courses/:id/students')
	.get(facultyController.getCourseStudents);

module.exports = router;
