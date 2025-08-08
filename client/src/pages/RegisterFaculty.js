// src/pages/RegisterFaculty.js

import React, { useState, useContext } from 'react'; // --- FIX: Added 'useContext' to the import ---
import { Button, Form, Input, Upload, message, Card, Row, Col, Checkbox } from 'antd';
import { UploadOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

const RegisterFaculty = () => {
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [isLab, setIsLab] = useState(false);

    const [fileList, setFileList] = useState([]);
    const [batch1FileList, setBatch1FileList] = useState([]);
    const [batch2FileList, setBatch2FileList] = useState([]);

    // --- FIX: Properly get 'fetchCourses' from the context ---
    const { fetchCourses } = useContext(authContext);

    const navigate = useNavigate();

    const handleFileChange = (info, setFileListState) => {
        setFileListState(info.fileList.slice(-1));
    };

    const handleSubmit = async (values) => {
        setIsLoading(true);

        const formDataToSend = new FormData();

        // --- REVISED LOGIC for building FormData ---

        // 1. Explicitly handle the 'isLab' value from the form.
        const isLabCourse = values.isLab || false;
        formDataToSend.append('isLab', isLabCourse);

        // 2. Append all other text values from the form.
        for (const key in values) {
            if (key !== 'isLab') { // Avoid appending 'isLab' a second time
                formDataToSend.append(key, values[key] || '');
            }
        }

        // 3. Append the correct file(s) based on the isLab status.
        if (isLabCourse) {
            if (batch1FileList.length === 0 || batch2FileList.length === 0) {
                message.error('Please upload CSV files for both Batch 1 and Batch 2!');
                setIsLoading(false);
                return;
            }
            formDataToSend.append('batch1', batch1FileList[0].originFileObj);
            formDataToSend.append('batch2', batch2FileList[0].originFileObj);
        } else {
            if (fileList.length === 0) {
                message.error('Please upload the student list CSV file!');
                setIsLoading(false);
                return;
            }
            formDataToSend.append('file', fileList[0].originFileObj);
        }

        // --- END OF REVISED LOGIC ---

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/faculty/courses`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formDataToSend,
            });

            // It's crucial to check for a non-ok response here.
            if (!response.ok) {
                const errorData = await response.json();
                // This will now show the actual error message from the server.
                throw new Error(errorData.message || 'Failed to create the course.');
            }

            message.success('Course registered successfully!');
            await fetchCourses();

            form.resetFields();
            setFileList([]);
            setBatch1FileList([]);
            setBatch2FileList([]);
            setIsLab(false);

            navigate('/attendance');

        } catch (error) {
            // Any error, including the one from the server, will be displayed here.
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
                    Fill in the details below and upload student information to create a new course.
                </p>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={24}>
                        <Col xs={24} lg={12}>
                            <Card title="Course Details" type="inner">
                                <Form.Item label="Course Name" name="coursename" rules={[{ required: true }]}>
                                    <Input placeholder="e.g., Introduction to Programming" />
                                </Form.Item>
                                <Form.Item label="Course Code" name="coursecode" rules={[{ required: true }]}>
                                    <Input placeholder="e.g., CS101" />
                                </Form.Item>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Card title="Class Details & Student List" type="inner">
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Department / Year" name="dept" rules={[{ required: true }]}>
                                            <Input placeholder="e.g., CSE / 1" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Class / Section" name="class" rules={[{ required: true }]}>
                                            <Input placeholder="e.g., A" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="isLab" valuePropName="checked">
                                    <Checkbox onChange={(e) => setIsLab(e.target.checked)}>
                                        Is this a lab course?
                                    </Checkbox>
                                </Form.Item>

                                {isLab ? (
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Batch 1 Students (CSV)" required>
                                                <Upload accept=".csv" fileList={batch1FileList} beforeUpload={() => false} onChange={(info) => handleFileChange(info, setBatch1FileList)} maxCount={1}>
                                                    <Button icon={<UploadOutlined />}>Select Batch 1 File</Button>
                                                </Upload>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Batch 2 Students (CSV)" required>
                                                <Upload accept=".csv" fileList={batch2FileList} beforeUpload={() => false} onChange={(info) => handleFileChange(info, setBatch2FileList)} maxCount={1}>
                                                    <Button icon={<UploadOutlined />}>Select Batch 2 File</Button>
                                                </Upload>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                ) : (
                                    <Form.Item label="Student List (CSV)" required>
                                        <Upload accept=".csv" fileList={fileList} beforeUpload={() => false} onChange={(info) => handleFileChange(info, setFileList)} maxCount={1}>
                                            <Button icon={<UploadOutlined />}>Select Student File</Button>
                                        </Upload>
                                    </Form.Item>
                                )}
                            </Card>
                        </Col>
                    </Row>
                    <Form.Item className="mt-6 text-right">
                        <Button type="primary" htmlType="submit" loading={isLoading} size="large">
                            Create Course
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default RegisterFaculty;