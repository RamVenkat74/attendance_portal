// src/pages/Attendance.js

import React, { useState, useEffect, useContext } from 'react';
import { Select, DatePicker, Button, message, Spin, Empty, Row, Col } from 'antd';
import dayjs from 'dayjs';
import AttendanceTable from '../components/AttendanceTable';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

const getDayOfWeek = (date) => {
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	return days[dayjs(date).day()];
};

const Attendance = () => {
	const { courses, isCoursesLoading } = useContext(authContext);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [selectedDate, setSelectedDate] = useState(dayjs());
	const [selectedHour, setSelectedHour] = useState(null);
	const [selectedBatch, setSelectedBatch] = useState(null);
	const [students, setStudents] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [attendanceData, setAttendanceData] = useState(null);

	// --- REVISED useEffect to auto-select both batch and hour ---
	useEffect(() => {
		const autoSelectSlot = async () => {
			if (!selectedCourse || !selectedDate) {
				setSelectedHour(null);
				setSelectedBatch(null);
				return;
			}

			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`${backendUrl}/schedules/${selectedCourse._id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					setSelectedHour(null);
					setSelectedBatch(null);
					return;
				}

				const allSlots = await response.json();
				const dayOfWeek = getDayOfWeek(selectedDate);
				const firstRelevantSlot = allSlots.find(slot => slot.day === dayOfWeek);

				if (firstRelevantSlot) {
					setSelectedHour(firstRelevantSlot.hour);
					if (selectedCourse.isLab) {
						setSelectedBatch(firstRelevantSlot.batch);
					} else {
						setSelectedBatch(null);
					}
				} else {
					setSelectedHour(null);
					setSelectedBatch(null);
				}
			} catch (error) {
				console.error("Failed to auto-select slot:", error.message);
				setSelectedHour(null);
				setSelectedBatch(null);
			}
		};

		autoSelectSlot();
	}, [selectedCourse, selectedDate]);


	const handleFetchStudents = async () => {
		if (!selectedCourse || !selectedDate || !selectedHour) {
			message.warning('Please select a course, date, and hour.');
			return;
		}
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

					{selectedCourse && selectedCourse.isLab && (
						<Col xs={24} md={8} lg={3}>
							<label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
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
						<label className="block text-sm font-medium text-gray-700 mb-1">Select Hour</label>
						<Select
							className="w-full"
							placeholder="Hour"
							value={selectedHour}
							onChange={(value) => setSelectedHour(value)}
							options={hourOptions}
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