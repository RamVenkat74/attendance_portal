import React, { useEffect, useState } from "react";
import {
    Button,
    DatePicker,
    Form,
    Input,
    Card,
    Avatar,
    message,
    Select,
    Col,
    Row,
    Statistic,
    Spin,
    Empty
} from "antd";
import { Pie } from "react-chartjs-2";
import { url } from "../Backendurl";
import { AreaChartOutlined } from "@ant-design/icons";
import "chart.js/auto";
const { RangePicker } = DatePicker;

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
    },
};

const Dashboard = () => {
    const [form] = Form.useForm();
    const [studentData, setStudentData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (values) => {
        const { RegNo, daterange, course } = values;
        const [startDate, endDate] = daterange;

        setIsLoading(true);
        setStudentData(null); // Reset previous data

        try {
            const response = await fetch(`${url}/attendance/dashboard`, { // Updated API endpoint
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    RegNo,
                    startDate: startDate.format("YYYY-MM-DD"),
                    endDate: endDate.format("YYYY-MM-DD"),
                    coursecode: course,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // --- FIX: Check if data exists and is not empty ---
                if (data && data.length > 0) {
                    setStudentData(data[0]);
                } else {
                    message.warning("No attendance data found for this student in the selected range.");
                    setStudentData(null); // Explicitly set to null
                }
            } else {
                const errorData = await response.json();
                message.error(errorData.message || "No student found!");
                setStudentData(null);
            }
        } catch (error) {
            message.error("There was an error processing your request.");
            console.error("Fetch error: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        document.title = "ATTENDANCE SYSTEM | DASHBOARD";
        const fetchCourses = async () => {
            try {
                const coursesResponse = await fetch(`${url}/faculty/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const coursesData = await coursesResponse.json();
                setCourses(Array.isArray(coursesData) ? coursesData : []);
            } catch (err) {
                message.error("Failed to fetch courses. Please try again.");
                console.error(err);
            }
        };
        fetchCourses();
    }, []);

    const generateChartData = (data) => {
        const labels = ["Present", "Absent"];
        const presentData = data.present || 0;
        const absentData = (data.totalHours || 0) - presentData;

        return {
            labels,
            datasets: [
                {
                    label: "Attendance Summary",
                    backgroundColor: ["#4d4dff", "#ff6699"],
                    data: [presentData, absentData],
                },
            ],
        };
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Card className="shadow-md">
                <p className="block text-lg text-gray-700 font-semibold mb-4">
                    Generate a student's attendance summary
                </p>
                <Form
                    {...formItemLayout}
                    form={form}
                    style={{ maxWidth: 600 }}
                    onFinish={handleSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        label="Register Number"
                        name="RegNo"
                        rules={[{ required: true, message: "Please input the student register number!" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Course"
                        name="course"
                        rules={[{ required: true, message: "Please select the student's course!" }]}
                    >
                        <Select
                            options={courses.map((course) => ({
                                label: `${course.coursename}-${course.coursecode}`,
                                value: course.coursecode,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Select the date range:"
                        name="daterange"
                        rules={[{ required: true, message: "Please input the date range!" }]}
                    >
                        <RangePicker className="w-full" />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            icon={<AreaChartOutlined />}
                        >
                            Generate Report
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {isLoading && <div className="text-center mt-8"><Spin size="large" /></div>}

            {/* --- FIX: Only render this block if studentData is not null --- */}
            {studentData && !isLoading && (
                <div className="mt-6">
                    <Card className="mb-6 shadow-md">
                        <Card.Meta
                            avatar={<Avatar size="large">{(studentData.name && studentData.name[0]) || 'S'}</Avatar>}
                            title={<span className="font-bold text-xl">{studentData.name || 'Student Name Not Found'}</span>}
                            description={`Register Number: ${studentData.RegNo || 'N/A'}`}
                        />
                    </Card>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={12}>
                            <Card title="Attendance Statistics" className="shadow-md">
                                <Row>
                                    <Col span={12}>
                                        <Statistic title="Hours Present" value={studentData.present} valueStyle={{ color: "#3f8600" }} />
                                    </Col>
                                    <Col span={12}>
                                        <Statistic title="Hours Absent" value={studentData.totalHours - studentData.present} valueStyle={{ color: "#cf1322" }} />
                                    </Col>
                                </Row>
                                <Row className="mt-4">
                                    <Col span={24}>
                                        <Statistic title="Total Hours Conducted" value={studentData.totalHours} />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Attendance Chart" className="shadow-md" style={{ height: '100%' }}>
                                <div style={{ height: 300 }}>
                                    <Pie
                                        data={generateChartData(studentData)}
                                        options={{ responsive: true, maintainAspectRatio: false }}
                                    />
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}


            {!studentData && !isLoading && (
                <Card className="mt-6 text-center shadow-md">
                    <Empty description="No report generated. Please fill out the form above." />
                </Card>
            )}
        </div>
    );
};

export default Dashboard;
