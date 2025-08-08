// server/Routes/facultyRoutes.js

const { Router } = require('express');
const multer = require('multer');
const { protect } = require('../Middleware/middleware');
const facultyController = require('../Controllers/facultyController');

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.get('/dashboard', facultyController.getFacultyDashboard);

// --- MODIFIED ROUTE for file uploads ---
router.route('/courses')
	.post(
		upload.fields([
			{ name: 'file', maxCount: 1 },
			{ name: 'batch1', maxCount: 1 },
			{ name: 'batch2', maxCount: 1 }
		]),
		facultyController.createCourseWithStudents
	);

router.route('/courses/:id')
	.delete(facultyController.deleteCourse);

router.route('/courses/:id/students')
	.get(facultyController.getCourseStudents);

module.exports = router;