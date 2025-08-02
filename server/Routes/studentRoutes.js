const { Router } = require('express');
const { protect } = require('../Middleware/middleware');
const {
    addStudentToCourse,
    updateStudent,
    removeStudentFromCourse,
} = require('../Controllers/studentController');

const router = Router();

// Protect all routes in this file
router.use(protect);

router.route('/').post(addStudentToCourse); // POST /api/students
router.route('/:id').put(updateStudent); // PUT /api/students/123
router.route('/:studentId/courses/:courseId').delete(removeStudentFromCourse); // DELETE /api/students/123/courses/456

module.exports = router;