import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    message,
    Row,
    Col,
    Card,
    Select,
    Modal,
    Form,
    Input,
    Spin,
    Empty,
    Popconfirm,
} from 'antd';
import { DeleteOutlined, EditOutlined, UserAddOutlined, PlusOutlined } from '@ant-design/icons';
import { url as backendUrl } from '../Backendurl';

const EditData = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [students, setStudents] = useState([]);

    // Loading states
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);

    // Modal states
    const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
    const [isRepModalVisible, setIsRepModalVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const [studentForm] = Form.useForm();
    const [repForm] = Form.useForm();

    // --- Data Fetching ---

    // 1. Fetch the faculty's assigned courses on component mount
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                // --- FIX: Calling the new, correct dashboard endpoint ---
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
        document.title = 'ATTENDANCE SYSTEM | EDIT DATA';
    }, []);

    // 2. Fetch students whenever a course is selected
    const fetchStudents = async (courseId) => {
        if (!courseId) return;
        setIsStudentsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Using the new RESTful endpoint
            const response = await fetch(`${backendUrl}/faculty/courses/${courseId}/students`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch students for this course.');
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsStudentsLoading(false);
        }
    };

    // --- Modal Handling ---

    const showStudentModal = (student = null) => {
        setEditingStudent(student);
        studentForm.setFieldsValue(student || { StdName: '', RegNo: '' });
        setIsStudentModalVisible(true);
    };

    const showRepModal = () => {
        repForm.resetFields();
        setIsRepModalVisible(true);
    };

    const handleCancel = () => {
        setIsStudentModalVisible(false);
        setIsRepModalVisible(false);
        setEditingStudent(null);
    };

    // --- API Operations (CRUD) ---

    // Add or Edit a Student
    const handleStudentFormFinish = async (values) => {
        // This functionality would require new dedicated endpoints.
        // For now, we'll add a placeholder message.
        message.info('Add/Edit student functionality to be implemented with new endpoints.');
        handleCancel();
    };

    // Delete a Student
    const handleDeleteStudent = async (studentId) => {
        // This functionality would require a new dedicated endpoint.
        message.info('Delete student functionality to be implemented with a new endpoint.');
    };

    // Add a Representative
    const handleRepFormFinish = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/admin/representatives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...values, coursecode: selectedCourse.coursecode }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
            message.success('Representative added successfully!');
            handleCancel();
        } catch (error) {
            message.error(error.message);
        }
    };

    const columns = [
        { title: 'Registration Number', dataIndex: 'RegNo', key: 'RegNo' },
        { title: 'Name', dataIndex: 'StdName', key: 'StdName' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="flex gap-4">
                    <Button icon={<EditOutlined />} onClick={() => showStudentModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Student"
                        description="Are you sure you want to delete this student?"
                        onConfirm={() => handleDeleteStudent(record._id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Course Data</h1>

            <Card className="shadow-md mb-6">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={12}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select a Course to Manage</label>
                        <Select
                            loading={isCoursesLoading}
                            className="w-full"
                            placeholder="Select a course"
                            value={selectedCourse?._id}
                            onChange={(value) => {
                                const course = courses.find(c => c._id === value);
                                setSelectedCourse(course);
                                fetchStudents(value);
                            }}
                            options={courses.map((course) => ({
                                label: `${course.coursename} (${course.coursecode})`,
                                value: course._id,
                            }))}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        {selectedCourse && (
                            <div className="flex gap-2">
                                <Button type="primary" icon={<UserAddOutlined />} onClick={() => showStudentModal()}>
                                    Add Student
                                </Button>
                                <Button icon={<PlusOutlined />} onClick={showRepModal}>
                                    Add Representative
                                </Button>
                            </div>
                        )}
                    </Col>
                </Row>
            </Card>

            <Card className="shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                    {selectedCourse ? `Students in ${selectedCourse.coursecode}` : 'Select a course to see students'}
                </h2>
                {isStudentsLoading ? (
                    <div className="text-center"><Spin size="large" /></div>
                ) : students.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={students}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 'max-content' }}
                    />
                ) : (
                    <Empty description={selectedCourse ? 'No students found for this course.' : 'Please select a course.'} />
                )}
            </Card>

            <Modal
                title={editingStudent ? 'Edit Student' : 'Add New Student'}
                open={isStudentModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
            >
                <Form form={studentForm} layout="vertical" onFinish={handleStudentFormFinish}>
                    <Form.Item label="Student Name" name="StdName" rules={[{ required: true }]}>
                        <Input placeholder="Enter student's full name" />
                    </Form.Item>
                    <Form.Item label="Registration Number" name="RegNo" rules={[{ required: true }]}>
                        <Input placeholder="Enter student's registration number" />
                    </Form.Item>
                    <Form.Item className="text-right">
                        <Button onClick={handleCancel} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                            {editingStudent ? 'Update' : 'Add'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Add New Representative" open={isRepModalVisible} onCancel={handleCancel} footer={null} destroyOnClose>
                <Form form={repForm} layout="vertical" onFinish={handleRepFormFinish}>
                    <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                        <Input placeholder="Enter representative's username" />
                    </Form.Item>
                    <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                        <Input.Password placeholder="Enter a temporary password" />
                    </Form.Item>
                    <Form.Item className="text-right">
                        <Button onClick={handleCancel} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                            Add Representative
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EditData;
