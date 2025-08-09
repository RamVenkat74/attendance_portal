// src/pages/EditData.js

import React, { useState, useEffect, useContext } from 'react';
import {
    Row, Col, Card, Select, Button, message, Empty, Table, Modal, Form, Input, Popconfirm, List, Radio,
} from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, PlusOutlined, CrownOutlined } from '@ant-design/icons';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

const EditData = () => {
    const { courses, isCoursesLoading } = useContext(authContext);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
    const [isAddRepModalVisible, setIsAddRepModalVisible] = useState(false);
    const [isManageRepsModalVisible, setIsManageRepsModalVisible] = useState(false);
    const [representatives, setRepresentatives] = useState([]);
    const [editingRep, setEditingRep] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [studentForm] = Form.useForm();
    const [addRepForm] = Form.useForm();
    const [manageRepForm] = Form.useForm();

    // This useEffect now fetches students whenever the course OR batch changes
    useEffect(() => {
        const fetchStudentsForCourse = async () => {
            if (!selectedCourse) return;
            if (selectedCourse.isLab && !selectedBatch) {
                setStudents([]);
                return;
            }

            setIsStudentsLoading(true);
            setStudents([]);
            try {
                let url = `${backendUrl}/faculty/courses/${selectedCourse._id}/students`;
                if (selectedCourse.isLab && selectedBatch) {
                    url += `?batch=${selectedBatch}`;
                }

                const token = localStorage.getItem('token');
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch students.');
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                message.error(error.message);
            } finally {
                setIsStudentsLoading(false);
            }
        };

        fetchStudentsForCourse();
    }, [selectedCourse, selectedBatch]);

    useEffect(() => {
        document.title = 'ATTENDANCE SYSTEM | EDIT DATA';
    }, []);

    const handleCourseChange = (courseId) => {
        if (!courseId) {
            setSelectedCourse(null);
            setStudents([]);
            setSelectedBatch(null);
            return;
        }
        const course = courses.find(c => c._id === courseId);
        setSelectedCourse(course);
        setSelectedBatch(course.isLab ? 1 : null);
    };

    const handleStudentFormSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            let response;
            let successMessage;
            if (editingStudent) {
                response = await fetch(`${backendUrl}/students/${editingStudent._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(values),
                });
                successMessage = 'Student updated successfully!';
            } else {
                const body = { ...values, courseId: selectedCourse._id };
                if (selectedCourse.isLab && selectedBatch) {
                    body.batch = selectedBatch;
                }
                response = await fetch(`${backendUrl}/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(body),
                });
                successMessage = 'Student added successfully!';
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'An error occurred.');
            }
            message.success(successMessage);
            handleStudentModalCancel();
            // Trigger a refetch
            setSelectedCourse(course => ({ ...course }));
        } catch (error) {
            message.error(error.message);
        }
    };

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
    const showAddRepModal = () => setIsAddRepModalVisible(true);
    const handleAddRepCancel = () => {
        setIsAddRepModalVisible(false);
        addRepForm.resetFields();
    };

    const fetchRepresentatives = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/admin/representatives`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch representatives.');
            const data = await response.json();
            setRepresentatives(data);
        } catch (error) {
            message.error(error.message);
        }
    };

    const showManageRepsModal = () => {
        fetchRepresentatives();
        setIsManageRepsModalVisible(true);
    };

    const handleManageRepsCancel = () => {
        setIsManageRepsModalVisible(false);
        setEditingRep(null);
        manageRepForm.resetFields();
    };

    const handleDeleteRep = async (repId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/admin/representatives/${repId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
            message.success('Representative deleted successfully.');
            fetchRepresentatives();
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleRoleChangeSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backendUrl}/admin/representatives/${editingRep._id}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
            message.success('Role updated successfully.');
            setEditingRep(null);
            fetchRepresentatives();
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleAddRepFormSubmit = async (values) => {
        try {
            if (!selectedCourse) {
                message.error("Please select a course first to assign the representative.");
                return;
            }
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
            handleAddRepCancel();
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
            // Trigger a refetch
            setSelectedCourse(course => ({ ...course }));
        } catch (error) {
            message.error(error.message);
        }
    };

    const studentColumns = [
        { title: 'Register Number', dataIndex: 'RegNo', key: 'RegNo' },
        { title: 'Student Name', dataIndex: 'StdName', key: 'StdName' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <span className="space-x-2">
                    <Button icon={<EditOutlined />} onClick={() => showStudentModal(record)}>Edit</Button>
                    <Popconfirm
                        title="Remove Student"
                        description="Are you sure? This will remove the student from this course and all batches."
                        onConfirm={() => handleDeleteStudent(record._id)}
                        okText="Yes, Remove"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />}>Remove</Button>
                    </Popconfirm>
                </span>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Data</h1>
            <Card className="shadow-md mb-6">
                <Row gutter={24} align="bottom">
                    <Col xs={24} md={10}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select a Course</label>
                        <Select
                            loading={isCoursesLoading}
                            className="w-full"
                            placeholder="Select a course"
                            onChange={handleCourseChange}
                            options={courses.map(c => ({ label: `${c.coursename} (${c.coursecode})`, value: c._id }))}
                        />
                    </Col>

                    {selectedCourse && selectedCourse.isLab && (
                        <Col xs={24} md={4}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                            <Select
                                className="w-full"
                                value={selectedBatch}
                                onChange={(value) => setSelectedBatch(value)}
                                options={[{ value: 1, label: 'Batch 1' }, { value: 2, label: 'Batch 2' }]}
                            />
                        </Col>
                    )}

                    <Col>
                        <Button type="primary" icon={<CrownOutlined />} onClick={showManageRepsModal}>
                            Manage Representatives
                        </Button>
                    </Col>
                </Row>
            </Card>

            {selectedCourse && (
                <Card className="shadow-md">
                    <Row justify="space-between" align="middle" className="mb-4">
                        <Col>
                            <h2 className="text-xl font-semibold">
                                {selectedCourse.isLab ? `Batch ${selectedBatch} ` : ''}
                                Students in {selectedCourse.coursecode}
                            </h2>
                        </Col>
                        <Col className="space-x-2">
                            <Button type="default" icon={<UserAddOutlined />} onClick={showAddRepModal}>
                                Add Per-Course Rep
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
                        locale={{ emptyText: <Empty description="No students found for this course/batch." /> }}
                        pagination={{
                            defaultPageSize: 100,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                    />
                </Card>
            )}

            <Modal title={editingStudent ? 'Edit Student' : 'Add Student'} open={isStudentModalVisible} onCancel={handleStudentModalCancel} footer={null} destroyOnClose>
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

            <Modal title="Add Per-Course Representative" open={isAddRepModalVisible} onCancel={handleAddRepCancel} footer={null} destroyOnClose>
                <Form form={addRepForm} layout="vertical" onFinish={handleAddRepFormSubmit}>
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

            <Modal
                title="Manage Representative Roles"
                open={isManageRepsModalVisible}
                onCancel={handleManageRepsCancel}
                width={800}
                footer={null}
            >
                <List
                    dataSource={representatives}
                    renderItem={rep => (
                        <List.Item
                            actions={[
                                <Button onClick={() => { setEditingRep(rep); manageRepForm.setFieldsValue(rep); }}>
                                    Manage Role
                                </Button>,
                                <Popconfirm
                                    title="Delete Representative"
                                    description="Are you sure? This will permanently delete their account."
                                    onConfirm={() => handleDeleteRep(rep._id)}
                                    okText="Yes, Delete"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button danger>Delete</Button>
                                </Popconfirm>
                            ]}
                        >
                            <List.Item.Meta
                                title={rep.username}
                                description={`Current Role: ${rep.role === 'C' ? `Class Rep (${rep.assignedClass})` : 'Per-Course Rep'}`}
                            />
                        </List.Item>
                    )}
                />
                {editingRep && (
                    <Card title={`Editing role for ${editingRep.username}`} className="mt-4">
                        <Form form={manageRepForm} layout="vertical" onFinish={handleRoleChangeSubmit} initialValues={{ role: editingRep.role }}>
                            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                                <Radio.Group>
                                    <Radio.Button value="U">Per-Course Rep</Radio.Button>
                                    <Radio.Button value="C">Class Rep</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
                                {({ getFieldValue }) =>
                                    getFieldValue('role') === 'C' ? (
                                        <Form.Item name="assignedClass" label="Assigned Class" rules={[{ required: true, message: 'Please enter the class identifier (e.g., CSE / 3)' }]}>
                                            <Input placeholder="e.g., CSE / 3" />
                                        </Form.Item>
                                    ) : null
                                }
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">Save Changes</Button>
                                <Button onClick={() => setEditingRep(null)} style={{ marginLeft: 8 }}>Cancel</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                )}
            </Modal>
        </div>
    );
};

export default EditData;