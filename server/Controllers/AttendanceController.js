const asyncHandler = require('express-async-handler');
const Report = require('../Models/reportModel');
const Student = require('../Models/studentModel');
const Course = require('../Models/courseModel');
const Timetable = require('../Models/timetableModel');
const moment = require('moment');

const updateAttendance = asyncHandler(async (req, res) => {
	const { coursecode, date, hr, attendance } = req.body;
	if (!coursecode || !date || !hr || !attendance) {
		res.status(400);
		throw new Error('Course code, date, hour(s), and attendance data are required');
	}
	const course = await Course.findOne({ coursecode });
	if (!course) {
		res.status(404);
		throw new Error('Course not found');
	}
	const studentRegNos = attendance.map(att => att.RegNo);
	const studentDocs = await Student.find({ RegNo: { $in: studentRegNos } }).select('_id RegNo');
	const studentMap = new Map(studentDocs.map(s => [s.RegNo, s._id]));
	const attendanceWithIds = attendance.map(att => ({
		student: studentMap.get(att.RegNo),
		status: att.status,
	}));
	const bulkOps = hr.map(hour => ({
		updateOne: {
			filter: { course: course._id, date, hr: hour },
			update: {
				$set: {
					attendance: attendanceWithIds,
					freeze: true,
					isExpired: false,
					faculty: req.user.id,
				},
			},
			upsert: true,
		},
	}));
	if (bulkOps.length > 0) {
		await Report.bulkWrite(bulkOps);
	}
	res.status(200).json({ message: 'Attendance updated successfully.' });
});

const fetchData = asyncHandler(async (req, res) => {
	const { date, coursecode, hr } = req.body;
	if (!date || !coursecode || !hr || !Array.isArray(hr) || hr.length === 0) {
		res.status(400);
		throw new Error('Date, course code, and hour(s) are required.');
	}
	const course = await Course.findOne({ coursecode }).populate('students', 'RegNo StdName');
	if (!course || !course.students || course.students.length === 0) {
		res.status(404);
		throw new Error('No students found for this course.');
	}
	const students = course.students;
	const existingReport = await Report.findOne({
		course: course._id,
		date: date,
		hr: { $in: hr },
	}).populate('attendance.student', 'RegNo');

	let finalAttendanceData;
	let isExpired = false;
	let freeze = false;

	if (existingReport) {
		isExpired = existingReport.isExpired;
		freeze = existingReport.freeze;
		const attendanceMap = new Map(existingReport.attendance.map(att => [att.student.RegNo, att.status]));
		finalAttendanceData = students.map(student => ({
			RegNo: student.RegNo,
			Name: student.StdName,
			status: attendanceMap.get(student.RegNo) || 1,
		}));
	} else {
		finalAttendanceData = students.map(student => ({
			RegNo: student.RegNo,
			Name: student.StdName,
			status: 1,
		}));
	}
	const absentees = finalAttendanceData.filter(s => s.status === -1).length;
	res.status(200).json({
		reports: finalAttendanceData,
		count: students.length,
		absentees,
		isExpired,
		freeze,
	});
});

const studentDashboard = asyncHandler(async (req, res) => {
	const { RegNo, startDate, endDate, coursecode } = req.body;
	const student = await Student.findOne({ RegNo });
	const course = await Course.findOne({ coursecode });
	if (!student) {
		res.status(404);
		throw new Error('Student not found.');
	}
	if (!course) {
		res.status(404);
		throw new Error('Course not found.');
	}
	const result = await Report.aggregate([
		{ $match: { course: course._id, date: { $gte: new Date(startDate), $lte: new Date(endDate) }, freeze: true } },
		{ $unwind: '$attendance' },
		{ $match: { 'attendance.student': student._id } },
		{ $group: { _id: '$attendance.student', present: { $sum: { $cond: [{ $in: ['$attendance.status', [1, 2]] }, 1, 0] } }, totalHours: { $sum: 1 } } },
		{ $project: { _id: 0, RegNo: student.RegNo, name: student.StdName, present: '$present', totalHours: '$totalHours' } },
	]);
	if (result.length === 0) {
		return res.status(404).json({ message: 'No attendance data found for this student in the selected range.' });
	}
	res.status(200).json(result);
});

const unmarkedAttendanceHours = asyncHandler(async (req, res) => {
	const { courses } = req.body;

	if (!Array.isArray(courses) || courses.length === 0) {
		res.status(400);
		throw new Error('Please provide a valid array of course codes.');
	}

	const courseDocs = await Course.find({ coursecode: { $in: courses } }).select('_id coursecode');
	const courseMap = new Map(courseDocs.map(c => [c.coursecode, c._id]));

	const results = await Promise.all(courses.map(async (coursecode) => {
		const courseId = courseMap.get(coursecode);
		if (!courseId) return { coursecode, message: 'Course not found.' };

		const timetable = await Timetable.findOne({ course: courseId });
		if (!timetable) return { coursecode, message: 'No timetable found.' };

		const lastReport = await Report.findOne({ course: courseId }).sort({ date: -1 });
		if (!lastReport) return { coursecode, message: 'No attendance records found.' };

		const startDate = moment(lastReport.date).add(1, 'days');
		const endDate = moment().startOf('day');
		let scheduledHours = [];

		for (let m = startDate.clone(); m.isBefore(endDate); m.add(1, 'days')) {
			const dayOfWeek = m.format('dddd').toLowerCase();
			const hoursForDay = timetable.timetable[dayOfWeek] || [];
			hoursForDay.forEach(hr => scheduledHours.push({ date: m.toDate(), hr }));
		}

		if (scheduledHours.length === 0) return { coursecode, unmarkedHours: 0, pendingHours: [] };

		const markedReports = await Report.find({
			course: courseId,
			date: { $gte: startDate.toDate(), $lt: endDate.toDate() }
		}).select('date hr');

		const markedSet = new Set(markedReports.map(r => `${moment(r.date).format('YYYY-MM-DD')}|${r.hr}`));
		const pendingHours = scheduledHours.filter(
			scheduled => !markedSet.has(`${moment(scheduled.date).format('YYYY-MM-DD')}|${scheduled.hr}`)
		).map(p => ({ date: moment(p.date).format('YYYY-MM-DD'), hour: p.hr }));

		return { coursecode, unmarkedHours: pendingHours.length, pendingHours };
	}));

	res.status(200).json(results);
});

const deleteRecord = asyncHandler(async (req, res) => {
	const { date, hr, coursecode } = req.body;
	const course = await Course.findOne({ coursecode });
	if (!course) {
		res.status(404);
		throw new Error('Course not found');
	}
	const result = await Report.deleteOne({ course: course._id, date, hr });
	if (result.deletedCount === 0) {
		res.status(404);
		throw new Error('Attendance record not found.');
	}
	res.status(200).json({ message: 'Attendance record deleted successfully.' });
});

/**
 * @desc    Get all attendance records for a specific course
 * @route   GET /api/attendance/records/:courseId
 * @access  Private
 */
const getRecordsByCourse = asyncHandler(async (req, res) => {
	const course = await Course.findById(req.params.courseId);
	if (!course) {
		res.status(404);
		throw new Error('Course not found');
	}

	if (!course.faculty.includes(req.user.id)) {
		res.status(403);
		throw new Error('You are not authorized to view records for this course.');
	}

	const records = await Report.find({ course: req.params.courseId }).sort({ date: -1 });
	res.status(200).json(records);
});

module.exports = {
	updateAttendance,
	fetchData,
	studentDashboard,
	unmarkedAttendanceHours,
	deleteRecord,
	getRecordsByCourse,
};
