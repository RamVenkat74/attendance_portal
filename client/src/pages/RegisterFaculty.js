import React, { useState } from 'react';
import { Button, Form, Input, Upload, message, Card, Row, Col, Spin } from 'antd';
import { UploadOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { url as backendUrl } from '../Backendurl'; // Corrected Import

const RegisterFaculty = () => {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const navigate = useNavigate();

    const handleFileChange = ({ fileList }) => {
        // Allow only one file to be uploaded
        setFileList(fileList.slice(-1));
    };

    const handleSubmit = async (values) => {
        if (fileList.length === 0) {
            message.error('Please upload the student list CSV file!');
            return;
        }

        setIsLoading(true);

        const formDataToSend = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });
        formDataToSend.append('file', fileList[0].originFileObj);

        try {
            const token = localStorage.getItem('token');
            // --- FIX: Using the new, correct RESTful endpoint ---
            const response = await fetch(`${backendUrl}/faculty/courses`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create the course.');
            }

            message.success('Course registered successfully!');
            form.resetFields();
            setFileList([]);
            navigate('/attendance');
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                <BookOutlined /> Register New Course
            </h1>

            <Card className="shadow-md">
                <p className="text-md text-gray-600 mb-6">
                    Fill in the details below and upload a CSV file with student information to create a new course.
                </p>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="space-y-4"
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={12}>
                            <Card title="Course Details" type="inner">
                                <Form.Item
                                    label="Course Name"
                                    name="coursename"
                                    rules={[{ required: true, message: 'Please input the course name!' }]}
                                >
                                    <Input placeholder="e.g., Introduction to Programming" />
                                </Form.Item>
                                <Form.Item
                                    label="Course Code"
                                    name="coursecode"
                                    rules={[{ required: true, message: 'Please input the course code!' }]}
                                >
                                    <Input placeholder="e.g., CS101" />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card title="Class Details & Student List" type="inner">
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Department / Year"
                                            name="dept"
                                            rules={[{ required: true, message: 'Please input the department or year!' }]}
                                        >
                                            <Input placeholder="e.g., CSE / 1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Class / Section"
                                            name="class"
                                            rules={[{ required: true, message: 'Please input the class section!' }]}
                                        >
                                            <Input placeholder="e.g., A" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item
                                    label="Upload Student List (CSV)"
                                    name="file"
                                    rules={[{
                                        validator: () => fileList.length > 0 ? Promise.resolve() : Promise.reject('Please upload a CSV file!')
                                    }]}
                                >
                                    <Upload
                                        accept=".csv"
                                        fileList={fileList}
                                        beforeUpload={() => false}
                                        onChange={handleFileChange}
                                        maxCount={1}
                                    >
                                        <Button icon={<UploadOutlined />}>Select File</Button>
                                    </Upload>
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    <Form.Item className="mt-6 text-right">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            size="large"
                        >
                            Create Course
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default RegisterFaculty;
