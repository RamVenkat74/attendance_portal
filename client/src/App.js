import React, { useContext } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import HomeLayout from "./HomeLayout";
import RegisterFaculty from "./pages/RegisterFaculty";
import SignUp from "./pages/SignUp";
import EditData from "./pages/EditData";
import UnlockAttendance from "./pages/UnlockAttendance";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TimeTableVerify from "./pages/TimeTableVerify";
import { authContext } from "./context/authContext"; // Import your authContext

const App = () => {
	// Consume authentication state from your authContext
	const { auth, user } = useContext(authContext);

	// Show a loading indicator while the authentication status is being determined
	// Your AuthContext uses 'auth === null' to indicate loading
	if (auth === null) {
		return <div className="flex items-center justify-center min-h-screen text-lg">Loading application...</div>;
	}

	const getDefaultPage = () => {
		// Ensure user object is available before accessing its role property
		if (!user) {
			// This case should ideally be handled by the 'auth ? <Navigate to="/auth" />'
			// but as a fallback, if auth is true but user is somehow null
			return <Navigate to="/auth" />;
		}
		// Assuming 'A' is for Admin/Faculty and 'U' for regular user
		return user.role === "A" ? (
			<Profile />
		) : (
			<Attendance />
		);
	};

	return (
		<Router>
			<Routes>
				{/* Authentication Route */}
				<Route
					path="/auth"
					element={
						auth ? ( // Use 'auth' state from context
							<Navigate to="/" />
						) : (
							<Auth /> // Auth component will handle setting context state on success
						)
					}
				/>
				<Route
					path="/register"
					element={<SignUp />} // SignUp component will handle setting context state on success
				/>

				{/* Main Application Routes - Protected */}
				<Route
					path="/"
					element={
						auth ? ( // Use 'auth' state from context
							// HomeLayout now receives user as a prop, if it needs it directly.
							// Otherwise, HomeLayout's children can consume authContext themselves.
							<HomeLayout user={user} />
						) : (
							<Navigate to="/auth" />
						)
					}
				>
					{/* Default Route based on User Role */}
					<Route
						index
						element={
							auth && user ? ( // Ensure auth is true AND user is not null before checking role
								user.role === "U" ? (
									<Attendance />
								) : (
									getDefaultPage()
								)
							) : (
								<Navigate to="/auth" /> // Fallback if auth is true but user is null (shouldn't happen with proper context)
							)
						}
					/>

					{/* Protected routes for Admin/Faculty (user.role !== "U") */}
					<Route
						path="register-faculty"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<RegisterFaculty />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
					<Route
						path="dashboard"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<Dashboard />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
					<Route
						path="attendance"
						element={auth ? <Attendance /> : <Navigate to="/auth" />} // Only check auth, as all users might access this
					/>
					<Route
						path="profile"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<Profile />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
					<Route
						path="students"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<Students />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
					<Route
						path="edit"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<EditData />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
					<Route
						path="time-table"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<TimeTableVerify />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
					<Route
						path="unlock-attendance"
						element={
							auth && user && user.role !== "U" ? ( // Check auth, user, and role
								<UnlockAttendance />
							) : (
								<Navigate to="/404" />
							)
						}
					/>
				</Route>
				{/* 404 Route */}
				<Route path="/404" element={<NotFound />} />
				{/* Redirect any unknown routes to 404 */}
				<Route path="*" element={<Navigate to="/404" />} />
			</Routes>
		</Router>
	);
};

export default App;
