import React, { useState } from 'react';
import { Card, Typography, Segmented } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import AuthForm from '../components/AuthForm';

const { Title, Paragraph, Link, Text } = Typography;

const Auth = ({ setAuth, setUser }) => {
	const [loginType, setLoginType] = useState('Faculty');

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<Card className="w-full max-w-md shadow-lg">

				<div className="flex justify-center mb-6">
					<Segmented
						options={[
							{ label: 'Faculty', value: 'Faculty', icon: <UserOutlined /> },
							{ label: 'Representative', value: 'Representative', icon: <TeamOutlined /> },
						]}
						value={loginType}
						onChange={setLoginType}
					/>
				</div>

				<Title level={2} className="text-center">
					{loginType} Login
				</Title>
				<Paragraph className="text-center text-gray-500 mb-6">
					Welcome back! Please enter your credentials.
				</Paragraph>

				{/* --- FIX: Pass the loginType prop to the AuthForm --- */}
				<AuthForm
					setAuth={setAuth}
					setUser={setUser}
					isLogin={true}
					loginType={loginType}
				/>

				{loginType === 'Faculty' && (
					<div className="text-center mt-4">
						<Text>
							Don't have an account? <Link href="/register">Sign Up</Link>
						</Text>
					</div>
				)}
			</Card>
		</div>
	);
};

export default Auth;
