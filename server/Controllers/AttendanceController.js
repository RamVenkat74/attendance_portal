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
	const { date, coursecode, hr, batch } = req.body;

	if (!date || !coursecode || !hr || !Array.isArray(hr) || hr.length === 0) {
		res.status(400);
		throw new Error('Date, course code, and hour(s) are required.');
	}

	// --- UPDATED LOGIC: Fetch the course with all student lists populated ---
	const course = await Course.findOne({ coursecode })
		.populate('students', 'RegNo StdName')
		.populate('batch1Students', 'RegNo StdName')
		.populate('batch2Students', 'RegNo StdName');

	if (!course) {
		res.status(404);
		throw new Error('Course not found.');
	}

	let studentsForSession;

	// --- Determine the correct list of students based on course type and batch ---
	if (course.isLab) {
		if (!batch) {
			res.status(400);
			throw new Error('Batch number is required for this lab course.');
		}
		// Use loose equality (==) in case the batch number is a string
		if (batch == 1) {
			studentsForSession = course.batch1Students;
		} else if (batch == 2) {
			studentsForSession = course.batch2Students;
		} else {
			res.status(400);
			throw new Error('Invalid batch number.');
		}
	} else {
		// For a regular theory course, use the main students list
		studentsForSession = course.students;
	}

	if (!studentsForSession || studentsForSession.length === 0) {
		res.status(404);
		throw new Error('No students found for the selected course/batch.');
	}

	// Sort the final list by roll call number
	studentsForSession.sort((a, b) => a.RegNo.slice(-3).localeCompare(b.RegNo.slice(-3)));

	// The rest of the function for checking existing reports remains the same
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
		const attendanceMap = new Map(
			existingReport.attendance.map(att => [att.student.RegNo, att.status])
		);
		finalAttendanceData = studentsForSession.map(student => ({
			RegNo: student.RegNo,
			Name: student.StdName,
			status: attendanceMap.get(student.RegNo) || 1,
		}));
	} else {
		finalAttendanceData = studentsForSession.map(student => ({
			RegNo: student.RegNo,
			Name: student.StdName,
			status: 1, // Default to Present
		}));
	}

	const absentees = finalAttendanceData.filter(s => s.status === -1).length;

	res.status(200).json({
		reports: finalAttendanceData,
		count: studentsForSession.length,
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

const getRecordsByCourse = asyncHandler(async (req, res) => {
	const records = await Report.find({ course: req.params.courseId }).sort({ date: -1 });
	res.status(200).json(records);
});

const unlockRecord = asyncHandler(async (req, res) => {
	const report = await Report.findById(req.params.id);
	if (!report) {
		res.status(404);
		throw new Error('Attendance record not found');
	}
	report.freeze = false;
	report.isExpired = false;
	await report.save();
	res.status(200).json(report);
});

const deleteRecordById = asyncHandler(async (req, res) => {
	const report = await Report.findById(req.params.id);
	if (!report) {
		res.status(404);
		throw new Error('Attendance record not found');
	}
	await Report.deleteOne({ _id: req.params.id });
	res.status(200).json({ message: 'Attendance record deleted successfully' });
});

const getClassReport = asyncHandler(async (req, res) => {
	const { coursecode, startDate, endDate } = req.body;
	const course = await Course.findOne({ coursecode }).populate('students');
	if (!course || course.students.length === 0) {
		res.status(404);
		throw new Error('Course not found or no students enrolled.');
	}

	// Custom sort in JavaScript
	course.students.sort((a, b) => a.RegNo.slice(-3).localeCompare(b.RegNo.slice(-3)));
	const studentIds = course.students.map(s => s._id);

	// The rest of the aggregation remains the same
	const result = await Report.aggregate([
		{ $match: { course: course._id, date: { $gte: new Date(startDate), $lte: new Date(endDate) }, freeze: true } },
		{ $unwind: '$attendance' },
		{ $group: { _id: '$attendance.student', present: { $sum: { $cond: [{ $in: ['$attendance.status', [1, 2]] }, 1, 0] } }, totalHours: { $sum: 1 }, statuses: { $push: { date: '$date', hour: '$hr', status: '$attendance.status' } } } },
		{ $group: { _id: null, allStudents: { $push: '$$ROOT' } } },
		{ $project: { _id: 0, data: { $map: { input: studentIds, as: 'studentId', in: { $let: { vars: { studentData: { $arrayElemAt: [{ $filter: { input: '$allStudents', as: 's', cond: { $eq: ['$$s._id', '$$studentId'] } } }, 0] } }, in: { student: '$$studentId', present: { $ifNull: ['$$studentData.present', 0] }, totalHours: { $ifNull: ['$$studentData.totalHours', 0] }, statuses: { $ifNull: ['$$studentData.statuses', []] } } } } } } } },
		{ $unwind: '$data' },
		{ $replaceRoot: { newRoot: '$data' } },
		{ $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentDetails' } },
		{ $unwind: '$studentDetails' },
		{ $project: { _id: 0, RegNo: '$studentDetails.RegNo', name: '$studentDetails.StdName', courses: [{ present: '$present', totalHours: '$totalHours', statuses: '$statuses' }] } }
	]);

	// Final sort in JavaScript to ensure order
	result.sort((a, b) => a.RegNo.slice(-3).localeCompare(b.RegNo.slice(-3)));

	res.status(200).json(result);
});
const getMasterReport = asyncHandler(async (req, res) => {
	const { dept, class: courseClass, startDate, endDate } = req.body;
	if (!dept || !courseClass || !startDate || !endDate) {
		res.status(400);
		throw new Error('Department, class, and a date range are required.');
	}

	// 1. Find all courses for the class to get the complete student list
	const coursesInClass = await Course.find({ dept, class: courseClass }).populate('students', 'RegNo StdName');
	if (coursesInClass.length === 0) {
		res.status(404);
		throw new Error('No courses found for the selected department and class.');
	}

	// 2. Create a unique, master list of all students in that class
	const allStudentsInClass = coursesInClass.flatMap(course => course.students);
	const studentMap = new Map(allStudentsInClass.map(s => [s._id.toString(), s]));
	const uniqueStudents = Array.from(studentMap.values());
	const studentIds = uniqueStudents.map(s => s._id);

	if (studentIds.length === 0) {
		return res.status(200).json([]); // Return empty if no students
	}

	// 3. Aggregate attendance data ONLY for the students who have records
	const reportData = await Report.aggregate([
		{ $match: { date: { $gte: new Date(startDate), $lte: new Date(endDate) }, 'attendance.student': { $in: studentIds }, freeze: true } },
		{ $unwind: '$attendance' },
		{ $match: { 'attendance.student': { $in: studentIds } } },
		{ $group: { _id: '$attendance.student', totalPresent: { $sum: { $cond: [{ $in: ['$attendance.status', [1, 2]] }, 1, 0] } }, totalConducted: { $sum: 1 } } },
	]);

	// 4. Merge the master student list with the attendance data
	const reportMap = new Map(reportData.map(r => [r._id.toString(), r]));

	const finalReport = uniqueStudents.map(student => {
		const report = reportMap.get(student._id.toString());
		const totalPresent = report ? report.totalPresent : 0;
		const totalConducted = report ? report.totalConducted : 0;

		return {
			RegNo: student.RegNo,
			name: student.StdName,
			totalPresent,
			totalConducted,
			percentage: totalConducted > 0 ? parseFloat(((totalPresent / totalConducted) * 100).toFixed(2)) : 0,
		};
	});

	// 5. Apply the final roll call sort
	finalReport.sort((a, b) => a.RegNo.slice(-3).localeCompare(b.RegNo.slice(-3)));

	res.status(200).json(finalReport);
});
module.exports = {
	updateAttendance,
	fetchData,
	studentDashboard,
	unmarkedAttendanceHours,
	getRecordsByCourse,
	unlockRecord,
	deleteRecordById,
	getClassReport,
	getMasterReport
};
