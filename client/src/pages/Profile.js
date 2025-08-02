import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
	Card,
	Row,
	Col,
	List,
	Typography,
	Spin,
	Divider,
	Button,
	message,
	Collapse,
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
const { Panel } = Collapse;

const Profile = () => {
	const { user, logout } = useContext(authContext);
	const [dashboardData, setDashboardData] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();

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

	const handleRemoveRep = async (repId, courseId) => {
		message.info('Remove representative functionality to be implemented.');
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
								<Collapse ghost>
									<Panel header={`Representatives (${course.representatives.length})`} key="1">
										{course.representatives.length > 0 ? (
											<List
												dataSource={course.representatives}
												renderItem={(rep) => (
													<List.Item
														actions={[
															<Button type="link" danger onClick={() => handleRemoveRep(rep._id, course._id)}>
																Remove
															</Button>
														]}
													>
														{rep.username}
													</List.Item>
												)}
											/>
										) : <Text type="secondary">No representatives assigned.</Text>}
									</Panel>
								</Collapse>
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
