// src/pages/TimeTableVerify.js

import React, { useState, useContext } from 'react';
import {
	Row, Col, Card, Select, Button, message, Empty, List, Form, Popconfirm, Spin
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { authContext } from '../context/authContext';
import { url as backendUrl } from '../Backendurl';

const TimeTableVerify = () => {
	const { courses, isCoursesLoading } = useContext(authContext);
	const [form] = Form.useForm();

	const [selectedCourse, setSelectedCourse] = useState(null);
	const [schedule, setSchedule] = useState([]);
	const [isScheduleLoading, setIsScheduleLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
	const hours = Array.from({ length: 8 }, (_, i) => i + 1);

	const fetchSchedule = async (courseId) => {
		if (!courseId) {
			setSchedule([]);
			return;
		}
		setIsScheduleLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/schedules/${courseId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error('Failed to fetch schedule.');
			const data = await response.json();
			setSchedule(data);
		} catch (error) {
			message.error(error.message);
		} finally {
			setIsScheduleLoading(false);
		}
	};

	const handleCourseChange = (courseId) => {
		const course = courses.find(c => c._id === courseId);
		setSelectedCourse(course);
		fetchSchedule(courseId);
		form.resetFields();
	};

	const handleAddSlot = async (values) => {
		setIsSubmitting(true);
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/schedules`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ ...values, courseId: selectedCourse._id }),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to add slot.');
			}
			message.success('Schedule slot added successfully!');
			fetchSchedule(selectedCourse._id); // Refresh the list
			form.resetFields();
		} catch (error) {
			message.error(error.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteSlot = async (slotId) => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/schedules/${slotId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error('Failed to delete slot.');
			message.success('Slot deleted successfully.');
			fetchSchedule(selectedCourse._id); // Refresh the list
		} catch (error) {
			message.error(error.message);
		}
	};

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Course Schedules</h1>
			<Card className="shadow-md mb-6">
				<Select
					loading={isCoursesLoading}
					className="w-full"
					placeholder="Select a course to manage its schedule"
					onChange={handleCourseChange}
					options={courses.map(course => ({
						label: `${course.coursename} (${course.coursecode})`,
						value: course._id,
					}))}
				/>
			</Card>

			{selectedCourse && (
				<Row gutter={24}>
					<Col xs={24} md={8}>
						<Card title="Add a New Slot" className="shadow-md">
							<Form form={form} layout="vertical" onFinish={handleAddSlot}>
								<Form.Item name="day" label="Day" rules={[{ required: true }]}>
									<Select placeholder="Select a day">
										{daysOfWeek.map(day => <Select.Option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</Select.Option>)}
									</Select>
								</Form.Item>
								<Form.Item name="hour" label="Hour" rules={[{ required: true }]}>
									<Select placeholder="Select an hour">
										{hours.map(hour => <Select.Option key={hour} value={hour}>Hour {hour}</Select.Option>)}
									</Select>
								</Form.Item>
								{selectedCourse.isLab && (
									<Form.Item name="batch" label="Batch" rules={[{ required: true }]}>
										<Select placeholder="Select a batch">
											<Select.Option value={1}>Batch 1</Select.Option>
											<Select.Option value={2}>Batch 2</Select.Option>
										</Select>
									</Form.Item>
								)}
								<Form.Item>
									<Button type="primary" htmlType="submit" loading={isSubmitting} icon={<PlusOutlined />}>
										Add Slot
									</Button>
								</Form.Item>
							</Form>
						</Card>
					</Col>
					<Col xs={24} md={16}>
						<Card title="Current Schedule" className="shadow-md">
							{isScheduleLoading ? <div className="text-center"><Spin /></div> : (
								<List
									dataSource={schedule}
									locale={{ emptyText: <Empty description="No schedule slots have been added for this course." /> }}
									renderItem={slot => (
										<List.Item
											actions={[
												<Popconfirm
													title="Are you sure you want to delete this slot?"
													onConfirm={() => handleDeleteSlot(slot._id)}
													okText="Yes"
													cancelText="No"
												>
													<Button type="text" danger icon={<DeleteOutlined />} />
												</Popconfirm>
											]}
										>
											<List.Item.Meta
												title={`${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} - Hour ${slot.hour}`}

												description={slot.batch ? `Batch ${slot.batch}` : 'Theory Class'}
											/>
										</List.Item>
									)}
								/>
							)}
						</Card>
					</Col>
				</Row>
			)}
		</div>
	);
};

export default TimeTableVerify;