const asyncHandler = require('express-async-handler');
const Student = require('../Models/studentModel');
const Course = require('../Models/courseModel');
const Report = require('../Models/reportModel');

/**
 * @desc    Add a new student and enroll them in a course
 * @route   POST /api/students
 * @access  Private
 */
const addStudentToCourse = asyncHandler(async (req, res) => {
    const { RegNo, StdName, courseId } = req.body;

    if (!RegNo || !StdName || !courseId) {
        res.status(400);
        throw new Error('Register number, name, and course ID are required.');
    }

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found.');
    }

    // Find student or create if they don't exist. This prevents duplicate students across the system.
    let student = await Student.findOneAndUpdate(
        { RegNo: RegNo.toUpperCase() },
        { $setOnInsert: { StdName, RegNo: RegNo.toUpperCase() } },
        { new: true, upsert: true }
    );

    // Add student to the course's student list if they are not already in it
    await Course.updateOne(
        { _id: courseId },
        { $addToSet: { students: student._id } }
    );

    res.status(201).json(student);
});

/**
 * @desc    Update a student's details
 * @route   PUT /api/students/:id
 * @access  Private
 */
const updateStudent = asyncHandler(async (req, res) => {
    const { RegNo, StdName } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
        res.status(404);
        throw new Error('Student not found.');
    }

    student.RegNo = RegNo.toUpperCase() || student.RegNo;
    student.StdName = StdName || student.StdName;

    const updatedStudent = await student.save();
    res.status(200).json(updatedStudent);
});

/**
 * @desc    Remove a student from a specific course
 * @route   DELETE /api/students/:studentId/courses/:courseId
 * @access  Private
 */
const removeStudentFromCourse = asyncHandler(async (req, res) => {
    const { studentId, courseId } = req.params;

    // Remove student from the course's student list
    await Course.updateOne(
        { _id: courseId },
        { $pull: { students: studentId } }
    );

    // Also remove the student's attendance records for this specific course
    await Report.updateMany(
        { course: courseId },
        { $pull: { attendance: { student: studentId } } }
    );

    res.status(200).json({ message: 'Student removed from course successfully.' });
});


module.exports = {
    addStudentToCourse,
    updateStudent,
    removeStudentFromCourse,
};