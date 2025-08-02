// src/components/Header.js (AppHeader.js)
import React, { useContext } from "react";
import { Layout, Button, Avatar, Space, Dropdown, Menu } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { authContext } from "../context/authContext";

const { Header } = Layout;

const AppHeader = () => {
	const { logout, user } = useContext(authContext);
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/auth');
	};

	const menu = (
		<Menu>
			<Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
				Profile
			</Menu.Item>

			<Menu.Divider />
			<Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
				Logout
			</Menu.Item>
		</Menu>
	);

	return (
		<Header
			style={{
				position: "fixed", // Keep fixed
				zIndex: 10, // Ensure header is above content
				width: 'calc(100% - 200px)', // Span width minus sidebar width
				left: 200, // Start after the sidebar
				top: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0 24px",
				background: "#fff",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
			}}
		>
			<div className="text-xl font-semibold text-gray-800">Attendance Manager</div>

			<Space size="middle">
				{user && (
					<Dropdown overlay={menu} placement="bottomRight" arrow>
						<Button type="text" className="flex items-center space-x-2">
							<Avatar icon={<UserOutlined />} src={user.profilePic} />
							<span className="font-medium text-gray-700">{user.username || 'User'}</span>
						</Button>
					</Dropdown>
				)}
			</Space>
		</Header>
	);
};

export default AppHeader;
