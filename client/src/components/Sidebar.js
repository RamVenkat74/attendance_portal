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
import { authContext } from "../context/authContext";

const { Sider } = Layout;

const Sidebar = () => {
	const { user } = useContext(authContext);
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedKey, setSelectedKey] = useState(location.pathname.substr(1));

	useEffect(() => {
		setSelectedKey(location.pathname.substr(1) || "attendance");
	}, [location]);

	const handleMenuClick = (e) => {
		navigate(`/${e.key}`);
	};

	const items = [
		{
			key: "attendance",
			icon: <SolutionOutlined />,
			label: "Attendance",
		},
		// --- THIS LOGIC IS NOW UPDATED ---
		// It shows the admin-level links ONLY if the user's role is 'A'.
		// Both 'U' (Rep) and 'C' (Class Rep) will see the limited view.
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
					key: "students",
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
					label: "Manage Schedules",
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