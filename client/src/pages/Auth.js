import React from 'react';
// --- FIX: Added 'Text' to the import from antd ---
import { Card, Typography } from 'antd';
import AuthForm from '../components/AuthForm';

const { Title, Paragraph, Link, Text } = Typography; // Destructure Text here

const Auth = ({ setAuth, setUser }) => {
	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<Card className="w-full max-w-md shadow-lg">
				<Title level={2} className="text-center">
					Faculty Login
				</Title>
				<Paragraph className="text-center text-gray-500 mb-6">
					Welcome back! Please enter your credentials.
				</Paragraph>
				<AuthForm setAuth={setAuth} setUser={setUser} isLogin={true} />
				<div className="text-center mt-4">
					<Text>
						Don't have an account? <Link href="/register">Sign Up</Link>
					</Text>
				</div>
			</Card>
		</div>
	);
};

export default Auth;
