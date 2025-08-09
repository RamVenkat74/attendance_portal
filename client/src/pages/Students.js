// src/pages/Students.js

import React, { useState, useContext } from 'react';
import {
    Row, Col, Card, Select, DatePicker, Table, Input, Button, message, Empty, Form,
} from 'antd';
import { FileExcelOutlined, SearchOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

const { RangePicker } = DatePicker;

// --- generateColumns is now back to its simpler, non-nested version ---
const generateColumns = (reportData, cycle, hoursPerCycle) => {
    if (!reportData || reportData.length === 0 || !reportData[0].courses) {
        return [
            { title: 'Reg. No', dataIndex: 'RegNo', key: 'RegNo', fixed: 'left', width: 150 },
            { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', width: 200 },
        ];
    }

    const columns = [
        { title: 'Reg. No', dataIndex: 'RegNo', key: 'RegNo', fixed: 'left', width: 150 },
        { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', width: 150 },
    ];

    const dailyStatuses = reportData[0].courses[0].statuses || [];
    const startIndex = (cycle - 1) * hoursPerCycle;
    const endIndex = startIndex + hoursPerCycle;
    const cycleStatuses = dailyStatuses.slice(startIndex, endIndex);

    cycleStatuses.forEach((status, i) => {
        const originalIndex = startIndex + i;
        const columnTitle = `${dayjs(status.date).format('DD-MMM-YY')} (H${status.hour})`;
        columns.push({
            title: <span>{columnTitle}</span>,
            exportTitle: columnTitle,
            key: `status-${originalIndex}`,
            width: 120,
            align: 'center',
            render: (text, record) => {
                const statusValue = record.courses[0]?.statuses[originalIndex]?.status;
                if (statusValue === 1) return 'P';
                if (statusValue === 2) return <span className="font-bold text-yellow-600">OD</span>;
                return <span className="font-bold text-red-600">A</span>;
            },
        });
    });

    columns.push(
        { title: 'Total Hours', dataIndex: ['courses', 0, 'totalHours'], key: 'total', width: 130, align: 'center' },
        { title: 'Present', dataIndex: ['courses', 0, 'present'], key: 'present', width: 130, align: 'center' },
        {
            title: 'Percentage',
            key: 'percentage',
            fixed: 'right',
            width: 130,
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
    const { courses, isCoursesLoading } = useContext(authContext);
    const [reportData, setReportData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [cycle, setCycle] = useState(1);
    const HOURS_PER_CYCLE = 20;
    const [pagination, setPagination] = useState({ current: 1, pageSize: 100 });

    const handlePaginationChange = (page, pageSize) => {
        setPagination({ current: page, pageSize: pageSize });
    };

    const totalStatuses = reportData[0]?.courses[0]?.statuses?.length || 0;
    const totalCycles = Math.ceil(totalStatuses / HOURS_PER_CYCLE);

    const handleGenerateReport = async (values) => {
        setCycle(1);
        const { courseId, dateRange } = values;
        const [startDate, endDate] = dateRange;
        const selectedCourse = courses.find(c => c._id === courseId);

        setIsReportLoading(true);
        setReportData([]);

        try {
            const token = localStorage.getItem('token');
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

    const columns = generateColumns(reportData, cycle, HOURS_PER_CYCLE);

    const filteredData = reportData.filter(student =>
        (student.name && student.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (student.RegNo && student.RegNo.toLowerCase().includes(searchText.toLowerCase()))
    );

    const exportToFile = (format) => {
        if (filteredData.length === 0) {
            message.error('No data to export.');
            return;
        }

        const flattenColumns = (cols) => {
            return cols.reduce((acc, col) => {
                if (col.children) {
                    return [...acc, ...flattenColumns(col.children)];
                }
                return [...acc, col];
            }, []);
        };

        const allColumnsForExport = generateColumns(reportData, 1, totalStatuses);
        const flatColumns = flattenColumns(allColumnsForExport);

        // --- FIX: Use the same reliable data generation for both CSV and PDF ---
        const bodyData = filteredData.map(student => {
            return flatColumns.map(col => {
                switch (col.key) {
                    case 'RegNo': return student.RegNo;
                    case 'name': return student.name;
                    case 'total': return student.courses[0]?.totalHours || 0;
                    case 'present': return student.courses[0]?.present || 0;
                    case 'percentage':
                        const course = student.courses[0];
                        if (!course || !course.totalHours) return 'N/A';
                        return Math.round((course.present * 100) / course.totalHours) + '%';
                    default:
                        if (col.key.startsWith('status-')) {
                            const index = parseInt(col.key.split('-')[1], 10);
                            const statusValue = student.courses[0]?.statuses[index]?.status;
                            if (statusValue === 1) return 'P';
                            if (statusValue === 2) return 'OD';
                            if (statusValue === -1) return 'A';
                            return '';
                        }
                        return '';
                }
            });
        });

        const courseName = form.getFieldValue('courseId') ? courses.find(c => c._id === form.getFieldValue('courseId')).coursename : 'report';
        const filename = `${courseName.replace(/\s+/g, '_')}_full_report`;

        if (format === 'csv') {
            const headers = flatColumns.map(col => col.exportTitle || col.title);
            const csv = Papa.unparse({ fields: headers, data: bodyData });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        else if (format === 'pdf') {
            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFontSize(16).text(`Class Attendance Report: ${courseName}`, 14, 15);

            const head = [[]];
            const subHead = [];
            head[0].push({ content: 'Reg. No', rowSpan: 2 });
            head[0].push({ content: 'Name', rowSpan: 2 });

            const dailyStatuses = reportData[0].courses[0].statuses || [];
            const monthlyGroups = dailyStatuses.reduce((acc, status) => {
                const monthYear = dayjs(status.date).format('MMMM YYYY');
                if (!acc[monthYear]) acc[monthYear] = [];
                acc[monthYear].push(status);
                return acc;
            }, {});

            Object.entries(monthlyGroups).forEach(([monthYear, statuses]) => {
                head[0].push({ content: monthYear, colSpan: statuses.length, styles: { halign: 'center' } });
                statuses.forEach(status => {
                    subHead.push({
                        content: `${dayjs(status.date).format('DD')}`,
                        styles: { halign: 'center' }
                    });
                });
            });

            head[0].push(
                { content: 'Total Hours', rowSpan: 2 },
                { content: 'Attended', rowSpan: 2 },
                { content: '%', rowSpan: 2 }
            );
            head.push(subHead);

            autoTable(doc, {
                head: head,
                body: bodyData, // This now uses the correct data format
                startY: 20,
                theme: 'grid',
                styles: { fontSize: 5, cellPadding: 1.5, halign: 'center' },
                headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', lineWidth: 0.1 },
                columnStyles: {
                    0: { cellWidth: 13 },
                    1: { cellWidth: 16 },
                    [flatColumns.length - 3]: { cellWidth: 8 }, // Total Hours
                    [flatColumns.length - 2]: { cellWidth: 7 }, // Present
                    [flatColumns.length - 1]: { cellWidth: 7 }, // Percentage
                },
                rowPageBreak: 'avoid',
            });

            doc.save(`${filename}.pdf`);
        }
    };
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
                            <div className="space-x-2">
                                <Button icon={<FileExcelOutlined />} onClick={() => exportToFile('csv')}>
                                    Export to CSV
                                </Button>
                                <Button icon={<FilePdfOutlined />} onClick={() => exportToFile('pdf')} type="primary" ghost>
                                    Export to PDF
                                </Button>
                            </div>
                        )}
                    </Col>
                </Row>

                {totalCycles > 1 && (
                    <div className="mb-4 text-center">
                        <Button.Group>
                            {Array.from({ length: totalCycles }, (_, i) => i + 1).map(c => (
                                <Button
                                    key={c}
                                    type={cycle === c ? 'primary' : 'default'}
                                    onClick={() => setCycle(c)}
                                >
                                    Hours {((c - 1) * HOURS_PER_CYCLE) + 1} - {Math.min(c * HOURS_PER_CYCLE, totalStatuses)}
                                </Button>
                            ))}
                        </Button.Group>
                    </div>
                )}

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="RegNo"
                    loading={isReportLoading}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description="No report generated." /> }}

                    // --- UPDATE THIS PROP ---
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        onChange: handlePaginationChange, // Add the onChange handler
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                />
            </Card>
        </div>
    );
};

export default Students;