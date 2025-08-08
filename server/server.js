const express = require('express');
const cors = require('cors');
const colors = require('colors');
const helmet = require('helmet');
require('dotenv').config();

// --- Refactored Imports ---
const connectDB = require('./Config/db');
const { errorHandler } = require('./Middleware/errorMiddleware');

// --- Route Imports ---
const facultyRoutes = require('./Routes/facultyRoutes');
const attendanceRoutes = require('./Routes/attendanceRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const timetableRoutes = require('./Routes/timetableRoutes');
const studentRoutes = require('./Routes/studentRoutes');
const scheduleRoutes = require('./Routes/scheduleRoutes');


// --- Initialization ---
connectDB();
const app = express();
const port = process.env.PORT || 5000;

// --- Core Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- API Routes ---
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schedules', scheduleRoutes);

// --- Centralized Error Handler ---
app.use(errorHandler);

// --- Start Server ---
app.listen(port, () => console.log(`Server started on port ${port}`.yellow.bold));