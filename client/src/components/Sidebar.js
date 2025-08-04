import React, { useState, useEffect, useContext } from "react";
import { Layout, Menu } from "antd";
import {
	UserOutlined,
	DashboardOutlined,
	SolutionOutlined,
	EditOutlined,
	UnlockOutlined,
	PlusOutlined,
	TableOutlined,
	FileDoneOutlined,
	BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { authContext } from "../context/authContext"; // Import AuthContext

const { Sider } = Layout;

const Sidebar = () => {
	const { user } = useContext(authContext); // Get user from context
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedKey, setSelectedKey] = useState(location.pathname.substr(1));

	useEffect(() => {
		// This keeps the correct menu item highlighted when the route changes
		setSelectedKey(location.pathname.substr(1) || "attendance");
	}, [location]);

	const handleMenuClick = (e) => {
		// This function handles the navigation when a menu item is clicked
		navigate(`/${e.key}`);
	};

	// This defines all the navigation items in the sidebar
	const items = [
		{
			key: "attendance",
			icon: <SolutionOutlined />,
			label: "Attendance",
		},
		// --- FIX: Conditionally render admin-only items based on user role ---
		...(user?.role === "A"
			? [
				{
					key: "profile",
					icon: <UserOutlined />,
					label: "Profile",
				},
				{
					key: "dashboard",
					icon: <DashboardOutlined />,
					label: "Dashboard",
				},
				{
					key: "students", // This is the "Summary" page
					icon: <BarChartOutlined />,
					label: "Summary",
				},
				{
					key: "master-report",
					icon: <FileDoneOutlined />,
					label: "Master Report",
				},
				{
					key: "edit-data",
					icon: <EditOutlined />,
					label: "Edit Data",
				},
				{
					key: "unlock-attendance",
					icon: <UnlockOutlined />,
					label: "Unlock Attendance",
				},
				{
					key: "register-faculty",
					icon: <PlusOutlined />,
					label: "Add Course",
				},
				{
					key: "time-table",
					icon: <TableOutlined />,
					label: "Time Table",
				},
			]
			: []),
	];

	return (
		<Sider
			breakpoint="lg"
			collapsedWidth="0"
			style={{
				height: "100vh",
				position: "fixed",
				left: 0,
				top: 0,
				bottom: 0,
				zIndex: 1000,
			}}
		>
			<div className="demo-logo-vertical" />
			<Menu
				theme="dark"
				mode="inline"
				selectedKeys={[selectedKey]}
				onClick={handleMenuClick}
				items={items}
			/>
		</Sider>
	);
};

export default Sidebar;
