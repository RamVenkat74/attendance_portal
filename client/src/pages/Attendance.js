// src/pages/Attendance.js

import React, { useState, useEffect, useContext } from 'react';
import { Select, DatePicker, Button, message, Spin, Empty, Row, Col } from 'antd';
import dayjs from 'dayjs';
import AttendanceTable from '../components/AttendanceTable';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

// Helper function remains the same
const getDayOfWeek = (date) => {
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	return days[dayjs(date).day()];
};

const Attendance = () => {
	// Get global course list from context
	const { user, courses, isCoursesLoading } = useContext(authContext);

	// Local state for this page's selections
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [selectedDate, setSelectedDate] = useState(dayjs());
	const [selectedHour, setSelectedHour] = useState(null);
	const [availableHours, setAvailableHours] = useState([]);

	const [students, setStudents] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [attendanceData, setAttendanceData] = useState(null);


	// --- NEW: State for selected batch ---
	const [selectedBatch, setSelectedBatch] = useState(null);

	// Effect to auto-select the hour from the timetable
	useEffect(() => {
		const fetchTimetableAndSetDefaults = async () => {
			if (!selectedCourse || !selectedDate) return;

			// --- FIX: Reset hour AND batch when selection changes ---
			setSelectedHour(null);
			setSelectedBatch(null);

			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`${backendUrl}/timetables/${selectedCourse._id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const data = await response.json();
					const dayOfWeek = getDayOfWeek(selectedDate);
					const scheduledHours = data.timetable?.[dayOfWeek] || [];

					if (scheduledHours.length > 0) {
						setSelectedHour(scheduledHours[0]); // Auto-select the first scheduled hour
					}
				}
			} catch (error) {
				console.error("Could not fetch timetable:", error);
			}
		};

		fetchTimetableAndSetDefaults();
	}, [selectedCourse, selectedDate]);

	useEffect(() => {
		const fetchAvailableHours = async () => {
			if (!selectedCourse || !selectedDate) return;

			// Reset dependent selections
			setAvailableHours([]);
			setSelectedHour(null);

			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`${backendUrl}/api/schedules/${selectedCourse._id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) throw new Error('Could not fetch schedule.');

				const allSlots = await response.json();
				const dayOfWeek = getDayOfWeek(selectedDate);

				// Filter slots for the selected day and batch (if applicable)
				const relevantSlots = allSlots.filter(slot => {
					if (slot.day !== dayOfWeek) return false;
					if (selectedCourse.isLab) {
						return slot.batch == selectedBatch; // Loose comparison for flexibility
					}
					return true; // For theory classes, batch doesn't matter
				});

				const hours = relevantSlots.map(slot => slot.hour).sort((a, b) => a - b);
				setAvailableHours(hours);

				// Auto-select the first available hour
				if (hours.length > 0) {
					setSelectedHour(hours[0]);
				}

			} catch (error) {
				console.error(error.message);
			}
		};

		fetchAvailableHours();
	}, [selectedCourse, selectedDate, selectedBatch]);

	const handleFetchStudents = async () => {
		// Validation checks
		if (!selectedCourse || !selectedDate || !selectedHour) {
			message.warning('Please select a course, date, and hour.');
			return;
		}
		// --- FIX: Data-driven check for lab course batch selection ---
		if (selectedCourse.isLab && !selectedBatch) {
			message.warning('Please select a batch for this lab course.');
			return;
		}

		setIsLoading(true);
		setStudents([]);
		setAttendanceData(null);

		try {
			const token = localStorage.getItem('token');
			const payload = {
				coursecode: selectedCourse.coursecode,
				date: selectedDate.format('YYYY-MM-DD'),
				hr: [selectedHour],
			};

			// --- FIX: Data-driven logic to add batch to payload ---
			if (selectedCourse.isLab) {
				payload.batch = selectedBatch;
			}

			const response = await fetch(`${backendUrl}/attendance/data`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify(payload),
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

	const hourOptions = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Hour ${i + 1}` }));

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Mark Attendance</h1>
			<div className="bg-white p-6 rounded-lg shadow-md mb-6">
				<Row gutter={[24, 16]} align="bottom">
					<Col xs={24} md={12} lg={8}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
						<Select
							loading={isCoursesLoading}
							className="w-full"
							placeholder="Select a course"
							value={selectedCourse?._id}
							onChange={(value) => {
								const course = courses.find(c => c._id === value);
								setSelectedCourse(course);
								setSelectedBatch(null); // Reset batch on course change
							}}
							options={courses.map(course => ({
								value: course._id,
								label: `${course.coursecode} - ${course.coursename}`,
							}))}
						/>
					</Col>
					<Col xs={24} md={12} lg={5}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
						<DatePicker
							className="w-full"
							value={selectedDate}
							onChange={(date) => setSelectedDate(date)}
							format="YYYY-MM-DD"
						/>
					</Col>

					{/* --- FIX: Conditionally render Batch Selector based on data --- */}
					{selectedCourse && selectedCourse.isLab && (
						<Col xs={24} md={8} lg={3}>
							<Select
								className="w-full"
								placeholder="Batch"
								value={selectedBatch}
								onChange={(value) => setSelectedBatch(value)}
								options={[{ value: 1, label: 'Batch 1' }, { value: 2, label: 'Batch 2' }]}
							/>
						</Col>
					)}

					<Col xs={24} md={8} lg={3}>
						<Select
							className="w-full"
							placeholder="Hour"
							value={selectedHour}
							onChange={(value) => setSelectedHour(value)}
							// --- Options are now dynamically generated ---
							options={availableHours.map(hour => ({
								value: hour,
								label: `Hour ${hour}`,
							}))}
							notFoundContent={
								<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No scheduled hours" />
							}
						/>
					</Col>
					<Col xs={24} md={8} lg={5}>
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

			{/* The rest of your JSX for displaying the table remains the same */}
			{isLoading ? (
				<div className="text-center p-10"><Spin size="large" /></div>
			) : students.length > 0 && attendanceData ? (
				<AttendanceTable
					students={students}
					setStudents={setStudents}
					course={selectedCourse}
					date={selectedDate.format('YYYY-MM-DD')}
					hour={selectedHour}
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