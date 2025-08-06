const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');

const Course = require('../Models/courseModel');
const Student = require('../Models/studentModel');
const Report = require('../Models/reportModel');
const Timetable = require('../Models/timetableModel');

const normalizeHeader = (header) => {
    const normalized = header.replace(/\s+/g, '').toLowerCase();
    if (['regno', 'registernumber'].includes(normalized)) return 'RegNo';
    if (['stdname', 'studentname', 'name'].includes(normalized)) return 'StdName';
    return null;
};

const getFacultyDashboard = asyncHandler(async (req, res) => {
    const facultyId = req.user.id;
    const dashboardData = await Course.aggregate([
        { $match: { faculty: new mongoose.Types.ObjectId(facultyId) } },
        { $lookup: { from: 'students', localField: 'students', foreignField: '_id', as: 'studentDetails' } },
        { $lookup: { from: 'admins', localField: 'faculty', foreignField: '_id', as: 'facultyDetails' } },
        { $lookup: { from: 'reports', localField: '_id', foreignField: 'course', as: 'reports' } },
        {
            $project: {
                _id: 1,
                coursename: 1,
                coursecode: 1,
                studentCount: { $size: '$studentDetails' },
                hoursTaught: { $size: '$reports' },
                representatives: { $filter: { input: '$facultyDetails', as: 'faculty', cond: { $eq: ['$$faculty.role', 'U'] } } },
            },
        },
    ]);
    res.status(200).json(dashboardData);
});

const createCourseWithStudents = asyncHandler(async (req, res) => {
    const { coursename, coursecode, class: courseClass, dept } = req.body;
    const file = req.file;
    const facultyId = req.user.id;

    if (!file) {
        res.status(400);
        throw new Error('Student CSV file is required');
    }

    const studentsFromCsv = [];
    fs.createReadStream(file.path)
        .pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
        .on('data', (row) => {
            if (row.RegNo && row.StdName) {
                studentsFromCsv.push({ RegNo: row.RegNo.toUpperCase(), StdName: row.StdName });
            }
        })
        .on('end', async () => {
            try {
                const bulkOps = studentsFromCsv.map(student => ({
                    updateOne: {
                        filter: { RegNo: student.RegNo },
                        update: { $setOnInsert: student },
                        upsert: true,
                    },
                }));
                if (bulkOps.length > 0) {
                    await Student.bulkWrite(bulkOps);
                }
                const studentRegNos = studentsFromCsv.map(s => s.RegNo);
                const studentDocs = await Student.find({ RegNo: { $in: studentRegNos } }).select('_id');
                const studentIds = studentDocs.map(s => s._id);
                const course = await Course.findOneAndUpdate(
                    { coursecode },
                    {
                        coursename,
                        coursecode,
                        class: courseClass,
                        dept,
                        $addToSet: { faculty: facultyId },
                        students: studentIds,
                    },
                    { upsert: true, new: true }
                );
                fs.unlinkSync(file.path);
                res.status(201).json({ message: 'Course created successfully', course });
            } catch (error) {
                fs.unlinkSync(file.path);
                throw new Error('Error processing CSV file: ' + error.message);
            }
        });
});

const getCourseStudents = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id).populate('students', 'RegNo StdName');

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    // --- FIX: Apply custom roll call sorting ---
    const sortedStudents = [...course.students].sort((a, b) => {
        const rollNoA = a.RegNo.slice(-3);
        const rollNoB = b.RegNo.slice(-3);
        return rollNoA.localeCompare(rollNoB);
    });

    res.status(200).json(sortedStudents);
});

const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }
    await Report.deleteMany({ course: course._id });
    await Timetable.deleteOne({ course: course._id });
    await Course.deleteOne({ _id: course._id });
    res.status(200).json({ message: 'Course and all associated data deleted successfully.' });
});

module.exports = { getFacultyDashboard, createCourseWithStudents, getCourseStudents, deleteCourse };
