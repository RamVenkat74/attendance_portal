import React from "react";
import { Layout } from "antd";
import Sidebar from "./components/Sidebar";
import AppHeader from "./components/Header";
import { Outlet } from "react-router-dom";

const { Content, Footer } = Layout;

const HomeLayout = () => {
	return (
		<Layout style={{ minHeight: "100vh" }}>
			{/* Sidebar is fixed on the left */}
			<Sidebar />

			{/* Main layout for header and content, shifted by sidebar width */}
			<Layout style={{ marginLeft: 200 }}> {/* This pushes the main content area to the right */}
				{/* Header is fixed at the top, spanning remaining width */}
				<AppHeader />

				{/* Content area, with top margin for header and padding */}
				<Content style={{ padding: "16px", marginTop: "64px" }}> {/* Increased margin-top slightly for header height */}
					<Outlet />
				</Content>

				<Footer style={{ textAlign: "center", padding: "16px" }}>
					©{new Date().getFullYear()}
				</Footer>
			</Layout>
		</Layout>
	);
};

export default HomeLayout;
