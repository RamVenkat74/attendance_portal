import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Select,
    Button,
    message,
    Empty,
    Table,
    Modal,
    Form,
    Input,
    Popconfirm,
} from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, PlusOutlined } from '@ant-design/icons';
import { url as backendUrl } from '../Backendurl';

const EditData = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);

    // Modal States
    const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
    const [isRepModalVisible, setIsRepModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const [studentForm] = Form.useForm();
    const [repForm] = Form.useForm();

    // --- Data Fetching ---
    const fetchCourses = async () => {
        setIsCoursesLoading(true);
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

    useEffect(() => {
        fetchCourses();
        document.title = 'ATTENDANCE SYSTEM | EDIT DATA';
    }, []);

    const handleCourseChange = async (courseId) => {
        if (!courseId) {
            setSelectedCourse(null);
            setStudents([]);
            return;
        }

        const course = courses.find(c => c._id === courseId);
        setSelectedCourse(course);
        setIsStudentsLoading(true);
        setStudents([]);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/faculty/courses/${courseId}/students`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok)
                throw new Error('Failed to fetch students.');
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsStudentsLoading(false);
        }
    };

    // --- Modal Logic ---
    const showStudentModal = (student = null) => {
        setEditingStudent(student);
        studentForm.setFieldsValue(student || { RegNo: '', StdName: '' });
        setIsStudentModalVisible(true);
    };

    const handleStudentModalCancel = () => {
        setIsStudentModalVisible(false);
        setEditingStudent(null);
        studentForm.resetFields();
    };

    const showRepModal = () => {
        setIsRepModalVisible(true);
    };

    const handleRepModalCancel = () => {
        setIsRepModalVisible(false);
        repForm.resetFields();
    };

    // --- API Operations ---
    const handleStudentFormSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            let response;
            let successMessage;

            if (editingStudent) {
                // Update existing student
                response = await fetch(`${backendUrl}/students/${editingStudent._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(values),
                });
                successMessage = 'Student updated successfully!';
            } else {
                // Add new student
                response = await fetch(`${backendUrl}/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ ...values, courseId: selectedCourse._id }),
                });
                successMessage = 'Student added successfully!';
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'An error occurred.');
            }

            message.success(successMessage);
            handleStudentModalCancel();
            handleCourseChange(selectedCourse._id); // Refresh student list
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleRepFormSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/admin/representatives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...values, coursecode: selectedCourse.coursecode }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add representative.');
            }
            message.success('Representative added successfully!');
            handleRepModalCancel();
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/students/${studentId}/courses/${selectedCourse._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete student.');
            }
            message.success('Student removed from course successfully.');
            handleCourseChange(selectedCourse._id); // Refresh student list
        } catch (error) {
            message.error(error.message);
        }
    };

    // --- Table Columns ---
    const studentColumns = [
        { title: 'Register Number', dataIndex: 'RegNo', key: 'RegNo' },
        { title: 'Student Name', dataIndex: 'StdName', key: 'StdName' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <span className="space-x-2">
                    <Button icon={<EditOutlined />} onClick={() => showStudentModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Remove Student"
                        description="Are you sure? This will remove the student from this course and their attendance records."
                        onConfirm={() => handleDeleteStudent(record._id)}
                        okText="Yes, Remove"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Remove
                        </Button>
                    </Popconfirm>
                </span>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Data</h1>

            <Card className="shadow-md mb-6">
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select a Course</label>
                        <Select
                            loading={isCoursesLoading}
                            className="w-full"
                            placeholder="Select a course to manage its data"
                            onChange={handleCourseChange}
                            options={courses.map(course => ({
                                label: `${course.coursename} (${course.coursecode})`,
                                value: course._id,
                            }))}
                        />
                    </Col>
                </Row>
            </Card>

            {selectedCourse && (
                <Card className="shadow-md">
                    <Row justify="space-between" align="middle" className="mb-4">
                        <Col>
                            <h2 className="text-xl font-semibold">
                                Students in {selectedCourse.coursecode}
                            </h2>
                        </Col>
                        <Col className="space-x-2">
                            <Button type="default" icon={<UserAddOutlined />} onClick={showRepModal}>
                                Add Representative
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => showStudentModal()}>
                                Add Student
                            </Button>
                        </Col>
                    </Row>
                    <Table
                        columns={studentColumns}
                        dataSource={students}
                        rowKey="_id"
                        loading={isStudentsLoading}
                        locale={{ emptyText: <Empty description="No students found for this course." /> }}
                    />
                </Card>
            )}

            {/* Student Add/Edit Modal */}
            <Modal
                title={editingStudent ? 'Edit Student' : 'Add Student'}
                open={isStudentModalVisible}
                onCancel={handleStudentModalCancel}
                footer={null}
                destroyOnClose
            >
                <Form form={studentForm} layout="vertical" onFinish={handleStudentFormSubmit}>
                    <Form.Item name="RegNo" label="Register Number" rules={[{ required: true }]}>
                        <Input placeholder="Enter register number" />
                    </Form.Item>
                    <Form.Item name="StdName" label="Student Name" rules={[{ required: true }]}>
                        <Input placeholder="Enter student name" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            {editingStudent ? 'Save Changes' : 'Add Student'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Representative Add Modal */}
            <Modal
                title="Add Representative"
                open={isRepModalVisible}
                onCancel={handleRepModalCancel}
                footer={null}
                destroyOnClose
            >
                <Form form={repForm} layout="vertical" onFinish={handleRepFormSubmit}>
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input placeholder="Enter representative's username" />
                    </Form.Item>
                    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                        <Input.Password placeholder="Enter a temporary password" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Add Representative
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EditData;
