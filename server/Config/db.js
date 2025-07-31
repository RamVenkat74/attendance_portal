const mongoose = require('mongoose');
const colors = require('colors'); // For more readable console logs

/**
 * @desc    Establishes a connection to the MongoDB database.
 * This function includes event listeners to monitor the connection status
 * after the initial connection is made.
 */
const connectDB = async () => {
    try {
        // Mongoose 6+ no longer requires the useNewUrlParser and useUnifiedTopology options,
        // as they are now the default. This makes the connection call cleaner.
        const conn = await mongoose.connect(process.env.DB_URI, {
            dbName: 'Attendance', // Specifying dbName is a good practice
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1); // Exit process with failure
    }
};

// --- Optional but Recommended: Add Connection Event Listeners ---
// These provide feedback if the connection is lost during the app's lifecycle.

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected.'.red);
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.'.green);
});


module.exports = connectDB;
