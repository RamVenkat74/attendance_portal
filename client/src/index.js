// src/index.js (Example)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/authContext'; // Import your AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <AuthProvider> {/* This is essential! */}
            <App />
        </AuthProvider>
    </React.StrictMode>
);
