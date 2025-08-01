import React, { useEffect, useState } from 'react';
import {
	Row,
	Col,
	Card,
	Select,
	Spin,
	Button,
	message,
	Empty,
	List,
	Typography,
	Popconfirm,
	Avatar,
} from 'antd';
import { UnlockOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { url as backendUrl } from '../Backendurl';

const { Text } = Typography;

const UnlockAttendance = () => {
	const [courses, setCourses] = useState([]);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [records, setRecords] = useState([]);
	const [isCoursesLoading, setIsCoursesLoading] = useState(true);
	const [isRecordsLoading, setIsRecordsLoading] = useState(false);

	// --- Data Fetching ---

	const fetchCourses = async () => {
		setIsCoursesLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/faculty/dashboard`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error('Failed to fetch courses.');
			const data = await response.json();
			setCourses(data || []);
		} catch (err) {
			message.error(err.message || 'Failed to fetch courses.');
		} finally {
			setIsCoursesLoading(false);
		}
	};

	useEffect(() => {
		fetchCourses();
		document.title = 'ATTENDANCE SYSTEM | UNLOCK';
	}, []);

	const handleCourseChange = async (courseId) => {
		const course = courses.find(c => c._id === courseId);
		setSelectedCourse(course);
		setRecords([]);

		if (!courseId) return;

		setIsRecordsLoading(true);
		try {
			const token = localStorage.getItem('token');
			// This endpoint needs to be created on the backend
			const response = await fetch(`${backendUrl}/attendance/records/${courseId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message);
			}
			const data = await response.json();
			setRecords(data);
		} catch (error) {
			message.error(error.message || 'Failed to fetch records.');
		} finally {
			setIsRecordsLoading(false);
		}
	};

	// --- API Operations ---

	const handleUnlock = async (recordId) => {
		// This functionality needs a dedicated backend endpoint
		message.info('Unlock functionality to be implemented.');
	};

	const handleDelete = async (recordId) => {
		// This functionality needs a dedicated backend endpoint
		message.info('Delete functionality to be implemented.');
	};

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<h1 className="text-2xl font-bold mb-6 text-gray-800">
				<UnlockOutlined /> Manage Attendance Records
			</h1>

			<Card className="shadow-md mb-6">
				<Row gutter={24}>
					<Col xs={24} md={12}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select a Course</label>
						<Select
							loading={isCoursesLoading}
							className="w-full"
							placeholder="Select a course to manage its records"
							value={selectedCourse?._id}
							onChange={handleCourseChange}
							options={courses.map(course => ({
								label: `${course.coursename} (${course.coursecode})`,
								value: course._id,
							}))}
						/>
					</Col>
				</Row>
			</Card>

			<Card className="shadow-md">
				<h2 className="text-xl font-semibold mb-4">
					{selectedCourse ? `Recorded Sessions for ${selectedCourse.coursecode}` : 'Select a course to see records'}
				</h2>
				{isRecordsLoading ? (
					<div className="text-center p-10"><Spin size="large" /></div>
				) : selectedCourse ? (
					<List
						itemLayout="horizontal"
						dataSource={records}
						renderItem={(record) => (
							<List.Item
								actions={[
									record.freeze ? (
										<Button type="primary" onClick={() => handleUnlock(record._id)}>
											Unlock
										</Button>
									) : (
										<Text type="success">Unlocked</Text>
									),
									<Popconfirm
										title="Delete Record"
										description="Are you sure? This will permanently delete this attendance record."
										onConfirm={() => handleDelete(record._id)}
										okText="Yes, Delete"
										okButtonProps={{ danger: true }}
									>
										<Button danger icon={<DeleteOutlined />} />
									</Popconfirm>,
								]}
							>
								<List.Item.Meta
									avatar={<Avatar icon={<CalendarOutlined />} />}
									title={`Date: ${dayjs(record.date).format('DD-MMM-YYYY')}`}
									description={`Hour: ${record.hr} | Status: ${record.freeze ? 'Locked' : 'Unlocked'}`}
								/>
							</List.Item>
						)}
						locale={{ emptyText: <Empty description="No attendance records found for this course." /> }}
					/>
				) : (
					<Empty description="Please select a course to get started." />
				)}
			</Card>
		</div>
	);
};

export default UnlockAttendance;
