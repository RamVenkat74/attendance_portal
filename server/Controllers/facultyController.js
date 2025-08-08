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
const readCsvStream = (filePath) => {
    return new Promise((resolve, reject) => {
        const students = [];
        fs.createReadStream(filePath)
            .pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
            .on('data', (row) => {
                if (row.RegNo && row.StdName) {
                    students.push({ RegNo: row.RegNo.toUpperCase(), StdName: row.StdName });
                }
            })
            .on('end', () => resolve(students))
            .on('error', (error) => reject(error));
    });
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
                isLab: 1,
                studentCount: { $size: '$studentDetails' },
                hoursTaught: { $size: '$reports' },
                representatives: { $filter: { input: '$facultyDetails', as: 'faculty', cond: { $eq: ['$$faculty.role', 'U'] } } },
            },
        },
    ]);
    res.status(200).json(dashboardData);
});

const createCourseWithStudents = asyncHandler(async (req, res) => {
    // This function now uses the corrected logic below.
    // Please replace your existing function with this one.

    const filesToDelete = [];
    try {
        const { coursename, coursecode, class: courseClass, dept, isLab } = req.body;
        const facultyId = req.user.id;
        const isLabCourse = isLab === 'true';

        let allStudents = [], batch1Students = [], batch2Students = [];

        if (isLabCourse) {
            if (!req.files || !req.files.batch1 || !req.files.batch2) {
                throw new Error('CSV files for both Batch 1 and Batch 2 are required.');
            }
            const batch1File = req.files.batch1[0];
            const batch2File = req.files.batch2[0];
            filesToDelete.push(batch1File.path, batch2File.path);

            batch1Students = await readCsvStream(batch1File.path);
            batch2Students = await readCsvStream(batch2File.path);

            const allStudentsMap = new Map();
            [...batch1Students, ...batch2Students].forEach(s => allStudentsMap.set(s.RegNo, s));
            allStudents = Array.from(allStudentsMap.values());
        } else {
            if (!req.files || !req.files.file || req.files.file.length === 0) {
                throw new Error('Student CSV file is required.');
            }
            const singleFile = req.files.file[0];
            filesToDelete.push(singleFile.path);
            allStudents = await readCsvStream(singleFile.path);
        }

        if (allStudents.length === 0) {
            throw new Error('No valid student data found in the provided CSV file(s).');
        }

        const bulkOps = allStudents.map(student => ({
            updateOne: {
                filter: { RegNo: student.RegNo },
                update: { $setOnInsert: student },
                upsert: true,
            },
        }));
        await Student.bulkWrite(bulkOps);

        const allStudentRegNos = allStudents.map(s => s.RegNo);
        const studentDocs = await Student.find({ RegNo: { $in: allStudentRegNos } }).select('_id RegNo');
        const studentMap = new Map(studentDocs.map(s => [s.RegNo, s._id.toString()])); // Use toString() for reliability

        // --- FIX: Ensure all student IDs are correctly retrieved before saving ---
        const allStudentIds = allStudents.map(s => studentMap.get(s.RegNo)).filter(id => id);
        const batch1StudentIds = batch1Students.map(s => studentMap.get(s.RegNo)).filter(id => id);
        const batch2StudentIds = batch2Students.map(s => studentMap.get(s.RegNo)).filter(id => id);

        const course = await Course.findOneAndUpdate(
            { coursecode },
            {
                coursename,
                coursecode,
                class: courseClass,
                dept,
                isLab: isLabCourse,
                $addToSet: { faculty: facultyId },
                students: allStudentIds,
                batch1Students: isLabCourse ? batch1StudentIds : [],
                batch2Students: isLabCourse ? batch2StudentIds : [],
            },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Course created successfully', course });

    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    } finally {
        filesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    }
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
