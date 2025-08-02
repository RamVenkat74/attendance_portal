// src/context/authContext.js
import React, { createContext, useState, useEffect } from 'react';

export const authContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null); // null indicates loading/initial check
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataString = localStorage.getItem('user');

        if (token && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                setUser(userData);
                setAuth(true); // Set to true if token and user data exist
            } catch (error) {
                console.error("Error parsing user data from localStorage:", error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setAuth(false); // Set to false if data is invalid
                setUser(null);
            }
        } else {
            setAuth(false); // Set to false if no token or user data
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setAuth(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setAuth(false);
    };

    const value = { user, auth, login, logout };

    if (auth === null) {
        return <div className="flex justify-center items-center h-screen text-lg">Loading application...</div>;
    }

    return (
        <authContext.Provider value={value}>
            {children}
        </authContext.Provider>
    );
};
