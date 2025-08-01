import React from 'react';
import { Table, Button, message, Checkbox } from 'antd';
import { url as backendUrl } from '../Backendurl';

const AttendanceTable = ({ students, setStudents, course, date, hour, initialData }) => {

	const handleStatusChange = (regNo, newStatus) => {
		const updatedStudents = students.map((student) =>
			student.RegNo === regNo ? { ...student, status: newStatus } : student
		);
		setStudents(updatedStudents);
	};

	const handleSubmit = async () => {
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${backendUrl}/attendance/records`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					coursecode: course.coursecode,
					coursename: course.coursename,
					date: date,
					hr: [hour], // API expects an array
					attendance: students.map(({ RegNo, status }) => ({ RegNo, status })),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to submit attendance.');
			}

			message.success('Attendance submitted successfully!');
			// Optionally, you might want to disable the table or navigate away
		} catch (error) {
			message.error(error.message);
		}
	};

	const columns = [
		{
			title: 'Reg. No',
			dataIndex: 'RegNo',
			key: 'RegNo',
		},
		{
			title: 'Name',
			dataIndex: 'Name',
			key: 'Name',
		},
		{
			title: 'Status',
			key: 'status',
			render: (_, record) => (
				<div className="flex gap-4">
					<Checkbox
						checked={record.status === 1}
						onChange={() => handleStatusChange(record.RegNo, 1)}
					>
						Present
					</Checkbox>
					<Checkbox
						checked={record.status === -1}
						onChange={() => handleStatusChange(record.RegNo, -1)}
					>
						Absent
					</Checkbox>
					<Checkbox
						checked={record.status === 2}
						onChange={() => handleStatusChange(record.RegNo, 2)}
					>
						On-Duty
					</Checkbox>
				</div>
			),
		},
	];

	// Disable the submit button if the attendance is already frozen or expired
	const isSubmissionDisabled = initialData?.freeze || initialData?.isExpired;

	return (
		<div>
			<Table
				dataSource={students}
				columns={columns}
				rowKey="RegNo"
				pagination={false}
				bordered
			/>
			<div className="text-right mt-4">
				<Button
					type="primary"
					onClick={handleSubmit}
					disabled={isSubmissionDisabled}
				>
					{isSubmissionDisabled ? 'Attendance Submitted' : 'Submit Attendance'}
				</Button>
			</div>
		</div>
	);
};

export default AttendanceTable;
