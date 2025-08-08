// src/context/authContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';

export const authContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);

    // --- NEW STATE for managing courses globally ---
    const [courses, setCourses] = useState([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);

    // --- NEW FUNCTION to fetch and update the global course list ---
    const fetchCourses = useCallback(async () => {
        // Only fetch if a user is logged in
        if (!localStorage.getItem('token')) {
            setCourses([]);
            return;
        }
        setIsCoursesLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Assuming this is your endpoint to get a faculty's courses
            const response = await fetch('http://localhost:5000/api/faculty/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch courses.');
            const data = await response.json();
            setCourses(data || []);
        } catch (error) {
            console.error("Failed to fetch courses for context:", error);
            setCourses([]); // Set to empty on error
        } finally {
            setIsCoursesLoading(false);
        }
    }, []); // Empty dependency array as it has no external dependencies

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataString = localStorage.getItem('user');

        if (token && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                setUser(userData);
                setAuth(true);
                // --- FETCH COURSES on initial load if logged in ---
                fetchCourses();
            } catch (error) {
                // ... existing error handling
                setAuth(false);
                setUser(null);
            }
        } else {
            setAuth(false);
        }
    }, [fetchCourses]); // Add fetchCourses to dependency array

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setAuth(true);
        // --- FETCH COURSES on login ---
        fetchCourses();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setAuth(false);
        // --- CLEAR COURSES on logout ---
        setCourses([]);
    };

    // --- ADDED courses, isCoursesLoading, and fetchCourses to the value ---
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