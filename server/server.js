const express = require('express');
const cors = require('cors');
const colors = require('colors');
const helmet = require('helmet');
require('dotenv').config();

// --- Refactored Imports ---
const connectDB = require('./Config/db');
const { errorHandler } = require('./Middleware/errorMiddleware');
// const startReportExpirationJob = require('./cron/reportExpiration'); // Optional

// --- Route Imports ---
const facultyRoutes = require('./Routes/facultyRoutes');
const attendanceRoutes = require('./Routes/attendanceRoutes');
const adminRoutes = require('./Routes/adminRoutes');

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
// This section correctly maps the URLs to your route files.
// Any request to "/api/faculty/..." will now be handled by facultyRoutes.js
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// --- Centralized Error Handler ---
app.use(errorHandler);

// --- Start Cron Jobs ---
// startReportExpirationJob(); // Optional

// --- Start Server ---
app.listen(port, () => console.log(`Server started on port ${port}`.yellow.bold));
