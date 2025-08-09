// src/context/authContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { url as backendUrl } from '../Backendurl'; // Make sure this is imported

export const authContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);

    // --- UPDATED fetchCourses function to be role-aware ---
    const fetchCourses = useCallback(async (currentUser) => {
        const userForFetch = currentUser || JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (!token || !userForFetch) {
            setCourses([]);
            return;
        }

        setIsCoursesLoading(true);
        try {
            // Choose the correct endpoint based on the user's role
            let endpoint = '';
            if (userForFetch.role === 'C') {
                endpoint = '/faculty/class-courses'; // New endpoint for Class Reps
            } else {
                endpoint = '/faculty/dashboard'; // Old endpoint for Admins/Reps
            }

            const response = await fetch(`${backendUrl}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch courses.');
            const data = await response.json();
            setCourses(data || []);
        } catch (error) {
            console.error("Failed to fetch courses for context:", error);
            setCourses([]);
        } finally {
            setIsCoursesLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataString = localStorage.getItem('user');
        if (token && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                setUser(userData);
                setAuth(true);
                // Pass the user data directly to ensure the correct role is used
                fetchCourses(userData);
            } catch (error) {
                setAuth(false);
                setUser(null);
            }
        } else {
            setAuth(false);
        }
    }, [fetchCourses]);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setAuth(true);
        // Pass the user data directly on login
        fetchCourses(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setAuth(false);
        setCourses([]);
    };

    const value = { user, auth, login, logout, courses, isCoursesLoading, fetchCourses };

    if (auth === null) {
        return <div className="flex justify-center items-center h-screen text-lg">Loading application...</div>;
    }

    return (
        <authContext.Provider value={value}>
            {children}
        </authContext.Provider>
    );
};