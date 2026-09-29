const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;

    if (err.name === "ValidationError" || err.name === "CastError") {
        statusCode = 400;
    } else if (err.code === 11000) {
        statusCode = 409;
    } else if (err.name === "MulterError") {
        statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    }

    const message = statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Request failed";

    return res.status(statusCode).json({
        success: false,
        message,
        errors: statusCode >= 500 ? [] : err.errors || [],
    });
};

export default errorMiddleware;