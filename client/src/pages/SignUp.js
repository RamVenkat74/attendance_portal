import React from 'react';
import { Card, Typography } from 'antd';
import AuthForm from '../components/AuthForm'; // Assuming AuthForm is used here

const { Title, Paragraph } = Typography;

const SignUp = () => {
	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<Card className="w-full max-w-md shadow-lg">
				<Title level={2} className="text-center">Sign Up</Title>
				<Paragraph className="text-center text-gray-500 mb-6">
					Create a new faculty account.
				</Paragraph>
				<AuthForm isLogin={false} />
			</Card>
		</div>
	);
};

export default SignUp;
