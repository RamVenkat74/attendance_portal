import React, { useEffect, useState } from 'react';
import {
	Table,
	Checkbox,
	Button,
	Form,
	Row,
	Col,
	notification,
	Spin,
	Card,
	Select,
	message,
	Empty,
} from 'antd';
import { SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { url as backendUrl } from '../Backendurl';

const TimeTableVerify = () => {
	const [form] = Form.useForm();
	const [courses, setCourses] = useState([]);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [isCoursesLoading, setIsCoursesLoading] = useState(true);
	const [isTimetableLoading, setIsTimetableLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const fetchCourses = async () => {
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
		fetchCourses();
		document.title = 'ATTENDANCE SYSTEM | TIMETABLE';
	}, []);

	const handleCourseChange = async (courseId) => {
		const course = courses.find(c => c._id === courseId);
		setSelectedCourse(course);
		form.resetFields();

		if (!courseId) return;

		setIsTimetableLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/timetables/${courseId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				const formValues = convertToFormValues(data.timetable);
				form.setFieldsValue(formValues);
			} else if (response.status !== 404) {
				const errorData = await response.json();
				throw new Error(errorData.message);
			}
		} catch (error) {
			message.error(error.message || 'An error occurred while fetching the timetable.');
		} finally {
			setIsTimetableLoading(false);
		}
	};

	const convertToFormValues = (timetable) => {
		const values = {};
		if (!timetable) return values;
		const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
		days.forEach((day, dayIndex) => {
			if (timetable[day]) {
				timetable[day].forEach(hour => {
					values[`hour${hour}_${dayIndex}`] = true;
				});
			}
		});
		return values;
	};

	const generateTimetableFromForm = (values) => {
		const timetable = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };
		const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
		days.forEach((day, dayIndex) => {
			for (let hour = 1; hour <= 8; hour++) {
				if (values[`hour${hour}_${dayIndex}`]) {
					timetable[day].push(hour);
				}
			}
		});
		return timetable;
	};

	const onFinish = async (values) => {
		if (!selectedCourse) {
			message.error('Please select a course first.');
			return;
		}
		setIsSubmitting(true);
		const timetable = generateTimetableFromForm(values);

		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/timetables`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					course: selectedCourse._id,
					timetable,
				}),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message);
			}
			notification.success({
				message: 'Success',
				description: 'Timetable has been saved successfully.',
			});
		} catch (error) {
			notification.error({
				message: 'Save Failed',
				description: error.message || 'An error occurred while saving the timetable.',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const columns = [
		{ title: 'Day', dataIndex: 'day', key: 'day', fixed: 'left', width: 120 },
		...Array.from({ length: 8 }, (_, i) => ({
			title: `Hour ${i + 1}`,
			key: `hour${i + 1}`,
			align: 'center',
			render: (_, record, dayIndex) => (
				<Form.Item name={`hour${i + 1}_${dayIndex}`} valuePropName="checked" noStyle>
					<Checkbox />
				</Form.Item>
			),
		})),
	];

	const tableData = [
		{ key: '0', day: 'Monday' },
		{ key: '1', day: 'Tuesday' },
		{ key: '2', day: 'Wednesday' },
		{ key: '3', day: 'Thursday' },
		{ key: '4', day: 'Friday' },
	];

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<h1 className="text-2xl font-bold mb-6 text-gray-800">
				<CalendarOutlined /> Manage Course Timetables
			</h1>
			<Card className="shadow-md mb-6">
				<Row gutter={24}>
					<Col xs={24} md={12}>
						<label className="block text-sm font-medium text-gray-700 mb-1">Select a Course</label>
						<Select
							loading={isCoursesLoading}
							className="w-full"
							placeholder="Select a course to view or edit its timetable"
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
			{selectedCourse ? (
				<Card className="shadow-md">
					{isTimetableLoading ? (
						<div className="text-center p-10"><Spin size="large" /></div>
					) : (
						<Form form={form} onFinish={onFinish}>
							<Table
								columns={columns}
								dataSource={tableData}
								pagination={false}
								bordered
								scroll={{ x: 'max-content' }}
								size="middle"
							/>
							<Row justify="end" className="mt-6">
								<Col>
									<Button
										type="primary"
										htmlType="submit"
										loading={isSubmitting}
										icon={<SaveOutlined />}
										size="large"
									>
										Save Timetable
									</Button>
								</Col>
							</Row>
						</Form>
					)}
				</Card>
			) : (
				<Card className="text-center shadow-md">
					<Empty description="Please select a course to get started." />
				</Card>
			)}
		</div>
	);
};

export default TimeTableVerify;
