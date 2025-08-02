import React, { useState, useContext } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { url as backendUrl } from '../Backendurl';
import { authContext } from '../context/authContext';

// The form now accepts a 'loginType' prop ('Faculty' or 'Representative')
const AuthForm = ({ isLogin, loginType }) => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useContext(authContext);

	const onFinish = async (values) => {
		setLoading(true);
		try {
			const endpoint = isLogin ? '/admin/auth/login' : '/admin/auth/register';
			const response = await fetch(`${backendUrl}${endpoint}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				// --- FIX: Send the loginType to the backend for verification ---
				body: JSON.stringify({ ...values, loginType }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'An error occurred.');
			}

			message.success(`Welcome, ${data.user.username}!`);
			login(data.user, data.token);
			navigate('/');
		} catch (error) {
			message.error(error.message);
			console.error('Login/Register error:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Form name="auth_form" onFinish={onFinish} layout="vertical">
			<Form.Item
				label="Username"
				name="username"
				rules={[{ required: true, message: 'Please input your username!' }]}
			>
				<Input />
			</Form.Item>

			<Form.Item
				label="Password"
				name="password"
				rules={[{ required: true, message: 'Please input your password!' }]}
			>
				<Input.Password />
			</Form.Item>

			<Form.Item>
				<Button type="primary" htmlType="submit" loading={loading} block>
					{isLogin ? 'Log In' : 'Sign Up'}
				</Button>
			</Form.Item>
		</Form>
	);
};

export default AuthForm;
