import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
	Card,
	Row,
	Col,
	Typography,
	Table,
	Spin,
	Divider,
	Button,
	message,
	Avatar,
	Statistic,
	Popconfirm,
	Empty
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, TeamOutlined, HourglassOutlined, DeleteOutlined } from '@ant-design/icons';
// --- FIX: Corrected the import path to match your lowercase filename ---
import { authContext } from '../context/authContext';
import { url as backendUrl } from '../Backendurl';

const { Title, Text } = Typography;

const getCourseAcronym = (courseName) => {
	if (!courseName || typeof courseName !== 'string') return '';

	const words = courseName.trim().split(/\s+/);

	if (words.length > 1) {
		// For multi-word names, take the first letter of each word (e.g., "Software Engineering Methodologies" -> "SEM")
		return words.map(word => word[0]).join('').toUpperCase();
	} else if (words[0].length > 0) {
		// For single-word names, take the first 3 letters (e.g., "English" -> "Eng")
		const singleWord = words[0];
		return singleWord.charAt(0).toUpperCase() + singleWord.slice(1, 3);
	}
	return '';
};

const processScheduleForTimetable = (scheduleSlots) => {
	const timetableData = {};
	const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

	days.forEach(day => {
		timetableData[day] = {};
		for (let i = 1; i <= 8; i++) {
			timetableData[day][`hour${i}`] = [];
		}
	});

	scheduleSlots.forEach(slot => {
		const key = `hour${slot.hour}`;
		if (timetableData[slot.day] && timetableData[slot.day][key]) {
			// Use the new getCourseAcronym function here
			const acronym = getCourseAcronym(slot.course.coursename);
			const entry = `${acronym}${slot.batch ? ` (B${slot.batch})` : ''}`;
			timetableData[slot.day][key].push(entry);
		}
	});

	return days.map(day => ({
		key: day,
		day: day.charAt(0).toUpperCase() + day.slice(1),
		...Object.fromEntries(Object.entries(timetableData[day]).map(([hour, courses]) => [hour, courses.join(' / ')]))
	}));
};

const Profile = () => {
	const { user, logout } = useContext(authContext);
	const [timetable, setTimetable] = useState([]);

	const [dashboardData, setDashboardData] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();
	useEffect(() => {
		const fetchFullTimetable = async () => {
			setIsLoading(true);
			try {
				const token = localStorage.getItem('token');
				const urlToFetch = `${backendUrl}/faculty/timetable`;

				// --- DEBUG: Log the URL we are about to fetch ---
				console.log('Attempting to fetch data from URL:', urlToFetch);

				const response = await fetch(urlToFetch, {
					headers: { Authorization: `Bearer ${token}` },
				});

				// --- DEBUG: Log the response status ---
				console.log('Received response with status:', response.status);

				if (!response.ok) throw new Error('Failed to fetch timetable.');

				const data = await response.json();
				console.log('Data received successfully:', data);

				const processedData = processScheduleForTimetable(data);
				setTimetable(processedData);
			} catch (error) {
				// --- DEBUG: Log any error that occurs during the fetch ---
				console.error('An error occurred in fetchFullTimetable:', error);
				message.error(error.message);
			} finally {
				setIsLoading(false);
			}
		};

		// --- DEBUG: Check if the useEffect hook is running ---
		console.log('Profile page useEffect is running. User object:', user);

		if (user) {
			fetchFullTimetable();
			document.title = `${user?.username || 'Faculty'} | Profile`;
		}
	}, [user]);

	// --- NEW TABLE COLUMN DEFINITIONS ---
	const columns = [
		{
			title: 'Day / Period',
			dataIndex: 'day',
			key: 'day',
			fixed: 'left',
			width: 120,
			render: (text) => <Text strong>{text}</Text>
		},
		...Array.from({ length: 8 }, (_, i) => ({
			title: `Hour ${i + 1}`,
			dataIndex: `hour${i + 1}`,
			key: `hour${i + 1}`,
			align: 'center',
			width: 110,
		})),
	];


	const fetchDashboardData = useCallback(async () => {
		setIsLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/faculty/dashboard`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				if (response.status === 401) {
					message.error('Your session has expired. Please log in again.');
					logout();
					navigate('/auth');
				}
				throw new Error('Failed to fetch dashboard data.');
			}
			const data = await response.json();
			setDashboardData(data);
		} catch (error) {
			message.error(error.message);
		} finally {
			setIsLoading(false);
		}
	}, [logout, navigate]);

	useEffect(() => {
		if (user) {
			fetchDashboardData();
			document.title = `${user?.username || 'Faculty'} | Profile`;
		}
	}, [user, fetchDashboardData]);


	const handleRemoveCourse = async (courseId) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/faculty/courses/${courseId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message);
			}
			message.success('Course and all associated data deleted successfully.');
			fetchDashboardData();
		} catch (error) {
			message.error(error.message);
		}
	};


	if (isLoading) {
		return <div className="text-center mt-20"><Spin size="large" /></div>;
	}

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<Card className="shadow-md mb-8">
				<Row align="middle" gutter={24}>
					<Col>
						<Avatar size={80} icon={<UserOutlined />} className="bg-blue-500">
							{user?.username?.[0]?.toUpperCase()}
						</Avatar>
					</Col>
					<Col>
						<Title level={2} className="mb-0">{user?.username}</Title>
						<Text type="secondary">Faculty Dashboard</Text>
					</Col>
				</Row>
			</Card>
			<Title level={3} className="mb-6">My Weekly Timetable</Title>

			<Card className="shadow-lg">
				<Table
					columns={columns}
					dataSource={timetable}
					bordered
					pagination={false}
					scroll={{ x: 'max-content' }}
					locale={{ emptyText: <Empty description="Your schedule is empty. Add slots on the 'Time Table' page." /> }}
				/>
			</Card>

			<Title level={3} className="mb-6">My Courses</Title>

			{dashboardData.length > 0 ? (
				<Row gutter={[24, 24]}>
					{dashboardData.map((course) => (
						<Col xs={24} md={12} lg={8} key={course._id}>
							<Card
								title={`${course.coursename} (${course.coursecode})`}
								className="shadow-lg h-full"
								extra={
									<Popconfirm
										title="Delete Course"
										description="Are you sure? This will delete the course and all its attendance records permanently."
										onConfirm={() => handleRemoveCourse(course._id)}
										okText="Yes, Delete"
										cancelText="No"
										okButtonProps={{ danger: true }}
									>
										<Button danger type="text" icon={<DeleteOutlined />} />
									</Popconfirm>
								}
							>
								<Row gutter={16}>
									<Col span={12}>
										<Statistic title="Students" value={course.studentCount} prefix={<TeamOutlined />} />
									</Col>
									<Col span={12}>
										<Statistic title="Hours Taught" value={course.hoursTaught} prefix={<HourglassOutlined />} />
									</Col>
								</Row>
								<Divider />

							</Card>
						</Col>
					))}
				</Row>
			) : (
				<Card className="text-center shadow-md">
					<Empty description="You are not assigned to any courses yet." />
				</Card>
			)}
		</div>
	);
};

export default Profile;
