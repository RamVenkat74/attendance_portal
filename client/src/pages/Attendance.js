import React, { useState, useEffect, useContext } from 'react';
import { Select, DatePicker, Button, message, Spin, Empty, Row, Col } from 'antd';
import dayjs from 'dayjs';
import AttendanceTable from '../components/AttendanceTable';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

// Helper to get the day of the week as a lowercase string (e.g., 'monday')
const getDayOfWeek = (date) => {
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	return days[dayjs(date).day()];
};

const Attendance = () => {
	const { user } = useContext(authContext);
	const [facultyCourses, setFacultyCourses] = useState([]);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [selectedDate, setSelectedDate] = useState(dayjs());
	const [selectedHour, setSelectedHour] = useState(null);
	const [students, setStudents] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isCoursesLoading, setIsCoursesLoading] = useState(true);
	const [attendanceData, setAttendanceData] = useState(null);

	// --- Fetch the faculty's assigned courses on component mount ---
	useEffect(() => {
		const fetchCourses = async () => {
			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`${backendUrl}/faculty/dashboard`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) throw new Error('Failed to fetch courses.');
				const data = await response.json();
				setFacultyCourses(data || []);
			} catch (error) {
				message.error(error.message || 'An error occurred while fetching courses.');
			} finally {
				setIsCoursesLoading(false);
			}
		};
		fetchCourses();
	}, []);

	// --- NEW: Effect to auto-select the hour based on the timetable ---
	useEffect(() => {
		const fetchTimetableAndSetHour = async () => {
			if (!selectedCourse || !selectedDate) {
				return;
			}

			// Reset hour when selection changes
			setSelectedHour(null);

			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`${backendUrl}/timetables/${selectedCourse._id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const data = await response.json();
					const dayOfWeek = getDayOfWeek(selectedDate);
					const scheduledHours = data.timetable?.[dayOfWeek] || [];

					// If there are scheduled hours for this day, default to the first one
					if (scheduledHours.length > 0) {
						setSelectedHour(scheduledHours[0]);
					}
				}
				// If response is 404 (no timetable found), we just do nothing and let the user select manually.
			} catch (error) {
				console.error("Could not fetch timetable:", error);
				// Don't show an error message, as this is an optional enhancement.
			}
		};

		fetchTimetableAndSetHour();
	}, [selectedCourse, selectedDate]); // This effect runs when the course or date changes

	const handleFetchStudents = async () => {
		if (!selectedCourse || !selectedDate || !selectedHour) {
			message.warning('Please select a course, date, and hour.');
			return;
		}
		setIsLoading(true);
		setStudents([]);
		setAttendanceData(null);
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/attendance/data`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					coursecode: selectedCourse.coursecode,
					date: selectedDate.format('YYYY-MM-DD'),
					hr: [selectedHour],
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch student data.');
			}
			const data = await response.json();
			setStudents(data.reports || []);
			setAttendanceData(data);
		} catch (error) {
			message.error(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const hourOptions = Array.from({ length: 8 }, (_, i) => ({
		value: i + 1,
		label: `Hour ${i + 1}`,
	}));

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Mark Attendance</h1>
			<div className="bg-white p-6 rounded-lg shadow-md mb-6">
				<Row gutter={[16, 16]} align="bottom">
					<Col xs={24} sm={12} md={8}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
						{isCoursesLoading ? <Spin /> : (
							<Select
								className="w-full"
								placeholder="Select a course"
								value={selectedCourse?._id}
								onChange={(value) => {
									const course = facultyCourses.find(c => c._id === value);
									setSelectedCourse(course);
								}}
								options={facultyCourses.map(course => ({
									value: course._id,
									label: `${course.coursecode} - ${course.coursename}`,
								}))}
							/>
						)}
					</Col>
					<Col xs={24} sm={12} md={6}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
						<DatePicker
							className="w-full"
							value={selectedDate}
							onChange={(date) => setSelectedDate(date)}
							format="YYYY-MM-DD"
						/>
					</Col>
					<Col xs={24} sm={12} md={4}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select Hour</label>
						<Select
							className="w-full"
							placeholder="Select hour"
							value={selectedHour}
							onChange={(value) => setSelectedHour(value)}
							options={hourOptions}
						/>
					</Col>
					<Col xs={24} sm={12} md={6}>
						<Button
							type="primary"
							className="w-full"
							onClick={handleFetchStudents}
							loading={isLoading}
						>
							Fetch Students
						</Button>
					</Col>
				</Row>
			</div>
			{isLoading ? (
				<div className="text-center p-10"><Spin size="large" /></div>
			) : students.length > 0 && attendanceData ? (
				<AttendanceTable
					students={students}
					setStudents={setStudents}
					course={selectedCourse}
					date={selectedDate.format('YYYY-MM-DD')}
					hour={selectedHour}
					user={user}
					initialData={attendanceData}
				/>
			) : (
				<div className="text-center p-10 bg-white rounded-lg shadow-md">
					<Empty description="Please make a selection to view student attendance." />
				</div>
			)}
		</div>
	);
};

export default Attendance;
