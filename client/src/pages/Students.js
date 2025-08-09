import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Select,
    DatePicker,
    Table,
    Input,
    Spin,
    Button,
    message,
    Empty,
    Form,
} from 'antd';
import { FileExcelOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Papa from 'papaparse';

import { url as backendUrl } from '../Backendurl';

const { RangePicker } = DatePicker;

// --- Helper Function to Generate Dynamic Columns ---
const generateColumns = (reportData) => {
    if (!reportData || reportData.length === 0 || !reportData[0].courses) {
        return [
            { title: 'Reg. No', dataIndex: 'RegNo', key: 'RegNo', fixed: 'left', width: 150 },
            { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', width: 200 },
        ];
    }

    const columns = [
        { title: 'Reg. No', dataIndex: 'RegNo', key: 'RegNo', fixed: 'left', width: 150 },
        { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', width: 200 },
    ];

    const dailyStatuses = reportData[0].courses[0].statuses || [];
    dailyStatuses.forEach((status, index) => {
        const columnTitle = `${dayjs(status.date).format('DD-MMM-YY')} (H${status.hour})`;
        columns.push({
            title: <span>{columnTitle}</span>,
            key: `status-${index}`,
            width: 120,
            align: 'center',
            render: (text, record) => {
                const statusValue = record.courses[0]?.statuses[index]?.status;
                if (statusValue === 1) return 'P';
                if (statusValue === 2) return <span className="font-bold text-yellow-600">OD</span>;
                return <span className="font-bold text-red-600">A</span>;
            },
        });
    });

    columns.push(
        { title: 'Total Hours', dataIndex: ['courses', 0, 'totalHours'], key: 'total', width: 120, align: 'center' },
        { title: 'Present', dataIndex: ['courses', 0, 'present'], key: 'present', width: 120, align: 'center' },
        {
            title: 'Percentage',
            key: 'percentage',
            fixed: 'right',
            width: 120,
            align: 'center',
            render: (text, record) => {
                const course = record.courses[0];
                if (!course || !course.totalHours) return 'N/A';
                const percentage = Math.round((course.present * 100) / course.totalHours);
                return <span className={percentage < 75 ? 'font-bold text-red-600' : ''}>{percentage}%</span>;
            },
        }
    );

    return columns;
};

// --- Main Component ---
const Students = () => {
    const [form] = Form.useForm();
    const [courses, setCourses] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);
    const [isReportLoading, setIsReportLoading] = useState(false);

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
        document.title = 'ATTENDANCE SYSTEM | CLASS REPORT';
    }, []);

    const handleGenerateReport = async (values) => {
        const { courseId, dateRange } = values;
        const [startDate, endDate] = dateRange;
        const selectedCourse = courses.find(c => c._id === courseId);

        setIsReportLoading(true);
        setReportData([]);

        try {
            const token = localStorage.getItem('token');
            // --- FIX: Using the new, correct class report endpoint ---
            const response = await fetch(`${backendUrl}/attendance/reports/class`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    coursecode: selectedCourse.coursecode,
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD'),
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate report.');
            }
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsReportLoading(false);
        }
    };

    const exportToCSV = () => {
        if (reportData.length === 0) {
            message.error('No data to export.');
            return;
        }

        // Dynamically create the headers from the table columns
        const headers = columns.map(col => col.title);

        // Convert the report data into a simple array of arrays for the CSV
        const data = reportData.map(student => {
            return columns.map(col => {
                // Handle different data keys
                switch (col.key) {
                    case 'RegNo':
                        return student.RegNo;
                    case 'name':
                        return student.name;
                    case 'total':
                        return student.courses[0]?.totalHours || 0;
                    case 'present':
                        return student.courses[0]?.present || 0;
                    case 'percentage':
                        const course = student.courses[0];
                        if (!course || !course.totalHours) return 'N/A';
                        return Math.round((course.present * 100) / course.totalHours) + '%';
                    default:
                        // This handles all the dynamic date/hour columns
                        if (col.key.startsWith('status-')) {
                            const index = parseInt(col.key.split('-')[1], 10);
                            const statusValue = student.courses[0]?.statuses[index]?.status;
                            if (statusValue === 1) return 'P';
                            if (statusValue === 2) return 'OD';
                            if (statusValue === -1) return 'A';
                            return ''; // No record for this slot
                        }
                        return '';
                }
            });
        });

        // Use papaparse to convert our data array to a CSV string
        const csv = Papa.unparse({
            fields: headers,
            data: data,
        });

        // Create a blob and trigger a download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'class_attendance_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const filteredData = reportData.filter(
        student =>
            (student.name && student.name.toLowerCase().includes(searchText.toLowerCase())) ||
            (student.RegNo && student.RegNo.toLowerCase().includes(searchText.toLowerCase()))
    );

    const columns = generateColumns(reportData);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Class Attendance Report</h1>

            <Card className="shadow-md mb-6">
                <Form form={form} layout="vertical" onFinish={handleGenerateReport}>
                    <Row gutter={24} align="bottom">
                        <Col xs={24} md={10}>
                            <Form.Item label="Select Course" name="courseId" rules={[{ required: true }]}>
                                <Select
                                    loading={isCoursesLoading}
                                    placeholder="Select a course to generate a report"
                                    options={courses.map(course => ({
                                        label: `${course.coursename} (${course.coursecode})`,
                                        value: course._id,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={10}>
                            <Form.Item label="Select Date Range" name="dateRange" rules={[{ required: true }]}>
                                <RangePicker className="w-full" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={4}>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={isReportLoading} className="w-full">
                                    Generate
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card className="shadow-md">
                <Row justify="space-between" align="middle" className="mb-4">
                    <Col>
                        <Input
                            placeholder="Search by name or register number"
                            prefix={<SearchOutlined />}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                        />
                    </Col>
                    <Col>
                        {reportData.length > 0 && (
                            <Button
                                icon={<FileExcelOutlined />}
                                onClick={exportToCSV}
                            >
                                Export to CSV
                            </Button>
                        )}
                    </Col>
                </Row>

                {isReportLoading ? (
                    <div className="text-center p-10"><Spin size="large" /></div>
                ) : reportData.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="RegNo"
                        loading={isReportLoading}
                        scroll={{ x: 'max-content' }}
                        pagination={{ pageSize: 10 }}
                    />
                ) : (
                    <Empty description="No report generated. Please fill out the form above." />
                )}
            </Card>
        </div>
    );
};

export default Students;
