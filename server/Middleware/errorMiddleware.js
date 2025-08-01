const errorHandler = (err, req, res, next) => {
    // Determine the status code. If the response already has one, use it. Otherwise, default to 500 (Internal Server Error).
    const statusCode = res.statusCode ? res.statusCode : 500;

    res.status(statusCode);

    // Send back a JSON response with the error message.
    // In a production environment, we don't want to leak the technical error details (the stack trace).
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
