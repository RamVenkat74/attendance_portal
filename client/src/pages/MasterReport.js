import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    DatePicker,
    Table,
    Spin,
    Button,
    message,
    Empty,
    Form,
    Input, // --- FIX: Import Input instead of Select ---
} from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import { url as backendUrl } from '../Backendurl';

const { RangePicker } = DatePicker;

const MasterReport = () => {
    const [form] = Form.useForm();
    const [reportData, setReportData] = useState([]);
    const [isReportLoading, setIsReportLoading] = useState(false);

    useEffect(() => {
        document.title = 'ATTENDANCE SYSTEM | MASTER REPORT';
    }, []);

    const handleGenerateReport = async (values) => {
        const { dept, class: courseClass, dateRange } = values;
        const [startDate, endDate] = dateRange;

        setIsReportLoading(true);
        setReportData([]);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/attendance/reports/master`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    dept,
                    class: courseClass,
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD'),
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate report.');
            }
            const data = await response.json();
            if (data.length === 0) {
                message.warning('No attendance records found for the selected criteria.');
            }
            setReportData(data);
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsReportLoading(false);
        }
    };

    const columns = [
        { title: 'Reg. No', dataIndex: 'RegNo', key: 'RegNo', fixed: 'left', width: 150 },
        { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', width: 250 },
        { title: 'Total Hours Conducted', dataIndex: 'totalConducted', key: 'totalConducted', align: 'center' },
        { title: 'Total Hours Present', dataIndex: 'totalPresent', key: 'totalPresent', align: 'center' },
        {
            title: 'Overall Percentage',
            dataIndex: 'percentage',
            key: 'percentage',
            align: 'center',
            fixed: 'right',
            width: 150,
            render: (percentage) => (
                <span className={percentage < 75 ? 'font-bold text-red-600' : 'font-bold text-green-600'}>
                    {percentage}%
                </span>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Master Attendance Report</h1>

            <Card className="shadow-md mb-6">
                <Form form={form} layout="vertical" onFinish={handleGenerateReport}>
                    <Row gutter={24} align="bottom">
                        {/* --- FIX: Changed Select to Input --- */}
                        <Col xs={24} md={8}>
                            <Form.Item label="Department / Year" name="dept" rules={[{ required: true, message: 'Please enter the department!' }]}>
                                <Input placeholder="e.g., CSE / 1" />
                            </Form.Item>
                        </Col>
                        {/* --- FIX: Changed Select to Input --- */}
                        <Col xs={24} md={8}>
                            <Form.Item label="Class / Section" name="class" rules={[{ required: true, message: 'Please enter the class!' }]}>
                                <Input placeholder="e.g., A" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Select Date Range" name="dateRange" rules={[{ required: true }]}>
                                <RangePicker className="w-full" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={isReportLoading} block>
                                    Generate Master Report
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card className="shadow-md">
                <Table
                    columns={columns}
                    dataSource={reportData}
                    rowKey="RegNo"
                    loading={isReportLoading}
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: <Empty description="No report generated. Please fill out the form above." /> }}
                />
            </Card>
        </div>
    );
};

export default MasterReport;
