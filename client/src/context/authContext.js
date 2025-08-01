import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataString = localStorage.getItem('user');

        if (token && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                setUser(userData);
                setAuth(true);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setAuth(false);
                setUser(null);
            }
        } else {
            setAuth(false);
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

    // Don't render the app until the auth status has been determined
    if (auth === null) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>; // Or a spinner component
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
