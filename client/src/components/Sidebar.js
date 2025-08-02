// src/components/Sidebar.js
import React, { useContext } from "react";
import { Layout, Menu } from "antd";
import {
	UserOutlined,
	DashboardOutlined,
	BookOutlined,
	TeamOutlined,
	EditOutlined,
	UnlockOutlined,
	CalendarOutlined,
	ProfileOutlined
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { authContext } from "../context/authContext";

const { Sider } = Layout;

const Sidebar = () => {
	const { user } = useContext(authContext);
	const location = useLocation();

	const getMenuItems = () => {
		const items = [];

		if (user) {
			items.push({
				key: 'profile',
				icon: <UserOutlined />,
				label: <Link to="/profile">Profile</Link>,
			});
		}

		if (user && user.role === "U") {
			items.push({
				key: 'attendance',
				icon: <BookOutlined />,
				label: <Link to="/attendance">Attendance</Link>,
			});
		}

		if (user && user.role !== "U") {
			items.push(
				{
					key: 'dashboard',
					icon: <DashboardOutlined />,
					label: <Link to="/dashboard">Dashboard</Link>,
				},
				{
					key: 'attendance',
					icon: <BookOutlined />,
					label: <Link to="/attendance">Attendance</Link>,
				},
				{
					key: 'students',
					icon: <TeamOutlined />,
					label: <Link to="/students">Students</Link>,
				},
				{
					key: 'edit',
					icon: <EditOutlined />,
					label: <Link to="/edit">Edit Data</Link>,
				},
				{
					key: 'unlock-attendance',
					icon: <UnlockOutlined />,
					label: <Link to="/unlock-attendance">Unlock Attendance</Link>,
				},
				{
					key: 'time-table',
					icon: <CalendarOutlined />,
					label: <Link to="/time-table">Time Table</Link>,
				},
				{
					key: 'register-faculty',
					icon: <ProfileOutlined />,
					label: <Link to="/register-faculty">Register Courses</Link>,
				},
			);
		}

		return items;
	};

	return (
		<Sider
			width={200} // Fixed width for the sidebar
			className="site-layout-background"
			style={{
				overflow: 'auto',
				height: '100vh',
				position: 'fixed', // Fixed position
				left: 0,
				top: 0,
				bottom: 0,
				zIndex: 100, // Ensure sidebar is above other content if needed
			}}
		>
			<div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px' }} />
			<Menu
				theme="dark"
				mode="inline"
				selectedKeys={[
					location.pathname === '/' ? (user && user.role === 'A' ? 'profile' : 'attendance') : location.pathname.split('/')[1]
				]}
				items={getMenuItems()}
			/>
		</Sider>
	);
};

export default Sidebar;
