import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/authContext'; // Make sure this path is correct
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* --- FIX: Wrap the entire App in the AuthProvider --- */}
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
