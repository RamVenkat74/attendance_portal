const express = require('express');
const cors = require('cors');
const colors = require('colors');
const connectDB = require('./Config/db');
const facultyRoutes = require('./Routes/facultyRoutes');
const attendanceRoutes = require('./Routes/attendanceRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const cron = require('node-cron');
const createReportCollection = require('./Models/reportModel');
const mongoose = require('mongoose');

require('dotenv').config();

const port = process.env.PORT || 5000;

connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

app.use((req, res, next) => {
	const currentDateTime = new Date().toLocaleString('en-IN', {
		timeZone: 'Asia/Kolkata',
	});
	const clientIp = req.headers['x-forwarded-for'] || req.ip;
	const method = req.method;

	const methodColors = {
		GET: colors.green,
		POST: colors.blue,
		PUT: colors.yellow,
		DELETE: colors.red,
		OPTIONS: colors.cyan,
		PATCH: colors.magenta,
	};

	const colorize = methodColors[method] || colors.white;

	console.log(
		colorize(
			`Request Method: ${method}, Request Path: ${req.path
			}, Request Time: ${currentDateTime}, Request IP: ${req.get('host')}`
		)
	);

	next();
});
cron.schedule('0 0 * * *', async () => {
	try {
		const now = new Date();

		// Get all collections
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		const reportCollections = collections
			.map((collection) => collection.name)
			.filter((name) => name.startsWith('reports_'));
		// Update reports in each report collection
		for (const collectionName of reportCollections) {
			const ReportCollection = createReportCollection(
				collectionName.replace('reports_', '')
			);
			console.log('cron called!!!', reportCollections);
			// Update reports where the creation date is more than 7 days ago
			const res = await ReportCollection.updateMany(
				{
					createdAt: { $lte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
					freeze: true,
					isExpired: false,
				},
				{
					$set: { freeze: true, isExpired: true },
				}
			);
			console.log(new Date(now - 7 * 24 * 60 * 60 * 1000));
			console.log(ReportCollection);
			console.log('result is : ', res);
		}

		console.log('CRON called - Reports updated successfully');
	} catch (err) {
		console.error('Error updating reports:', err);
	}
});

app.use('/api/students', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// app.get("/api", console.log("Hello world"));

app.listen(port, () => console.log(`Server started on port ${port}`));
